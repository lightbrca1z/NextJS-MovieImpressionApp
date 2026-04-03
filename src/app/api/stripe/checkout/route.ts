import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import {
  getAppBaseUrl,
  getStripe,
  getStripePriceId,
  isStripeBillingConfigured,
  isStripeCheckoutDisabled,
} from '@/lib/stripe'

export async function POST() {
  try {
    if (isStripeCheckoutDisabled()) {
      return NextResponse.json(
        {
          error:
            '現在、決済（Stripe Checkout）は停止しています。テスト段階が終わり次第、再開されます。',
        },
        { status: 403 }
      )
    }

    if (!isStripeBillingConfigured()) {
      return NextResponse.json(
        {
          error:
            'Stripe が未設定です。.env に STRIPE_SECRET_KEY と STRIPE_PRICE_ID（月額サブスクの Price ID）を設定してください。',
        },
        { status: 503 }
      )
    }

    const session = await auth()
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
    }

    const priceId = getStripePriceId()
    const stripe = getStripe()
    const base = getAppBaseUrl()

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, stripeCustomerId: true },
    })
    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${base}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/billing/cancel`,
      ...(user.stripeCustomerId
        ? { customer: user.stripeCustomerId }
        : { customer_email: user.email }),
      client_reference_id: user.id,
      metadata: {
        userId: user.id,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
        },
      },
    })

    if (!checkoutSession.url) {
      return NextResponse.json({ error: 'Checkout URL を取得できませんでした' }, { status: 500 })
    }

    return NextResponse.json({ url: checkoutSession.url })
  } catch (e) {
    console.error('[stripe/checkout]', e)
    const message = e instanceof Error ? e.message : 'Checkout の作成に失敗しました'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
