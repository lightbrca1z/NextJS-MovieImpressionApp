import Link from 'next/link'
import { auth } from '@/auth'
import { SubscribeCheckoutButton } from '@/components/SubscribeCheckoutButton'
import { getAppBaseUrl, isStripeBillingConfigured, isStripeCheckoutDisabled } from '@/lib/stripe'
import { FREE_TIER_REVIEW_LIMIT, getActiveSubscription } from '@/lib/subscription'

export const metadata = {
  title: '料金プラン — Movie Impression',
  description: '無料プラン（感想上限あり）と Stripe 月額プラン（感想無制限）',
}

export default async function PricingPage() {
  const session = await auth()
  const active = session?.user?.id ? await getActiveSubscription(session.user.id) : null
  const stripeReady = isStripeBillingConfigured()
  const checkoutFrozen = isStripeCheckoutDisabled()
  const appBase = getAppBaseUrl()

  return (
    <>
      <h1 className="page-title">料金プラン</h1>
      <p className="page-lead">
        無料ユーザーは感想の新規投稿が合計 <strong>{FREE_TIER_REVIEW_LIMIT} 件</strong>までです。月額プラン加入後は{' '}
        <strong>感想の投稿が無制限</strong>
        になります（決済は <strong>Stripe Checkout</strong>。テストモードならテストカードのみ）。
      </p>

      <div className="pricing-grid">
        <section className="pricing-card" aria-labelledby="plan-free">
          <h2 id="plan-free" className="pricing-card__title">
            無料プラン
          </h2>
          <p className="pricing-card__price">¥0</p>
          <ul className="pricing-card__list">
            <li>
              感想の新規投稿：<strong>{FREE_TIER_REVIEW_LIMIT} 件</strong>まで（アカウントあたりの累計）。
            </li>
            <li>上限に達したら、月額プランで無制限にアップグレードできます。</li>
          </ul>
          {!session?.user ? (
            <Link href="/register" className="btn btn--primary" style={{ textDecoration: 'none' }}>
              新規登録
            </Link>
          ) : (
            <p className="page-lead" style={{ margin: 0 }}>
              現在ご利用中のプランです。
            </p>
          )}
        </section>

        <section className="pricing-card pricing-card--highlight" aria-labelledby="plan-pro">
          <h2 id="plan-pro" className="pricing-card__title">
            月額プラン（Stripe）
          </h2>
          <p className="pricing-card__price">¥500 / 月（例・Stripe ダッシュボードの Price に準拠）</p>
          <ul className="pricing-card__list">
            <li>
              <strong>感想の新規投稿が無制限</strong>（アクティブなサブスク期間中）。
            </li>
            <li>お支払い後、Webhook で DB に反映されるまで数秒〜数分かかることがあります。</li>
            <li>成功 URL: {appBase}/billing/success</li>
          </ul>
          {!session?.user ? (
            <p className="page-lead" style={{ margin: 0 }}>
              <Link href="/login?callbackUrl=/pricing">ログイン</Link>
              してから Stripe Checkout へ進んでください。
            </p>
          ) : active ? (
            <p className="page-lead" style={{ margin: 0 }}>
              <strong>有効なサブスクリプション:</strong> {active.status}
              {active.currentPeriodEnd
                ? ` （次回更新目安: ${active.currentPeriodEnd.toLocaleString('ja-JP')}）`
                : null}
            </p>
          ) : (
            <SubscribeCheckoutButton
              stripeConfigured={stripeReady}
              checkoutFrozen={checkoutFrozen}
            />
          )}
        </section>
      </div>

      {stripeReady && !checkoutFrozen ? (
        <section className="pricing-test-hint" aria-labelledby="stripe-test-heading">
          <h2 id="stripe-test-heading" className="pricing-test-hint__title">
            Stripe テストモードの例
          </h2>
          <p className="page-lead" style={{ marginBottom: '0.5rem' }}>
            ダッシュボードがテストモードのとき、Checkout ではテストカード（例: <code className="inline-code">4242 4242 4242 4242</code>
            、有効期限は未来日、CVC 任意）が使えます。
          </p>
        </section>
      ) : null}

      <p className="page-lead" style={{ marginTop: '2rem' }}>
        <Link href="/">トップへ戻る</Link>
      </p>
    </>
  )
}
