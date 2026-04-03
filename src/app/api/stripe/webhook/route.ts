import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/stripe'

export const runtime = 'nodejs'

async function syncSubscriptionFromStripe(sub: Stripe.Subscription, fallbackUserId?: string | null) {
  const userId =
    sub.metadata?.userId ??
    fallbackUserId ??
    (await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: sub.id },
      select: { userId: true },
    }))?.userId

  if (!userId) {
    console.warn('[stripe/webhook] No userId for subscription', sub.id)
    return
  }

  const priceId = sub.items.data[0]?.price?.id ?? ''
  const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : null

  await prisma.subscription.upsert({
    where: { stripeSubscriptionId: sub.id },
    create: {
      userId,
      stripeSubscriptionId: sub.id,
      stripePriceId: priceId,
      status: sub.status,
      currentPeriodEnd: periodEnd,
    },
    update: {
      stripePriceId: priceId || undefined,
      status: sub.status,
      currentPeriodEnd: periodEnd,
    },
  })
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    console.error('[stripe/webhook] STRIPE_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  const rawBody = await req.text()
  const sig = req.headers.get('stripe-signature')
  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(rawBody, sig, secret)
  } catch (err) {
    console.error('[stripe/webhook] Signature verify failed', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const stripe = getStripe()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId ?? session.client_reference_id
        const customerId =
          typeof session.customer === 'string' ? session.customer : session.customer?.id
        const subId =
          typeof session.subscription === 'string' ? session.subscription : session.subscription?.id

        if (userId && customerId) {
          await prisma.user.update({
            where: { id: userId },
            data: { stripeCustomerId: customerId },
          })
        }

        if (userId && subId) {
          const sub = await stripe.subscriptions.retrieve(subId)
          await syncSubscriptionFromStripe(sub, userId)
        }
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        await syncSubscriptionFromStripe(sub, sub.metadata?.userId)
        break
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: {
            status: 'canceled',
            currentPeriodEnd: sub.current_period_end
              ? new Date(sub.current_period_end * 1000)
              : null,
          },
        })
        break
      }
      default:
        break
    }
  } catch (e) {
    console.error('[stripe/webhook] Handler error', event.type, e)
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
