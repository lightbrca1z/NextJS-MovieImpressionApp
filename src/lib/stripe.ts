import Stripe from 'stripe'

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env: ${name}`)
  return v
}

/** サーバー専用。クライアントに渡さないこと。 */
export function getStripe(): Stripe {
  return new Stripe(requireEnv('STRIPE_SECRET_KEY'), {
    apiVersion: '2025-02-24.acacia',
    typescript: true,
  })
}

export function getAppBaseUrl(): string {
  const u = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
  if (u) return u
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

export function getStripePriceId(): string {
  return requireEnv('STRIPE_PRICE_ID')
}

/** Checkout 利用可否（シークレットと Price ID のみ。Webhook は別ルート） */
export function isStripeBillingConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim() && process.env.STRIPE_PRICE_ID?.trim())
}

/** true のとき Checkout API・ボタンを止める（検証中・本番準備中など） */
export function isStripeCheckoutDisabled(): boolean {
  return process.env.DISABLE_STRIPE_CHECKOUT === 'true'
}
