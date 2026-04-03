'use client'

import { useState } from 'react'

type Props = {
  disabled?: boolean
  /** false のときボタンを出さず設定案内のみ（サーバー判断） */
  stripeConfigured?: boolean
  /** true のとき決済不可（API も 403。検証段階で課金を止める） */
  checkoutFrozen?: boolean
}

export function SubscribeCheckoutButton({
  disabled,
  stripeConfigured = true,
  checkoutFrozen = false,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (checkoutFrozen) {
    return (
      <div>
        <p className="pricing-setup-hint" role="status">
          <strong>決済は一時停止中です。</strong>
          検証・テスト段階のため Stripe Checkout は利用できません。再開するときは .env の{' '}
          <code className="inline-code">DISABLE_STRIPE_CHECKOUT</code> を削除するか{' '}
          <code className="inline-code">false</code> にし、サーバーを再起動してください。
        </p>
        <button
          type="button"
          className="btn btn--primary"
          disabled
          aria-disabled="true"
          style={{ opacity: 0.5, cursor: 'not-allowed' }}
        >
          Stripe Checkout で月額プランに申し込む
        </button>
      </div>
    )
  }

  if (!stripeConfigured) {
    return (
      <p className="pricing-setup-hint" role="status">
        有料プランの決済には Stripe の設定が必要です。プロジェクトの{' '}
        <code className="inline-code">.env.example</code> を参照し、<code className="inline-code">STRIPE_SECRET_KEY</code>{' '}
        と <code className="inline-code">STRIPE_PRICE_ID</code> を設定したうえでサーバーを再起動してください。ローカルでは{' '}
        <code className="inline-code">stripe listen --forward-to …/api/stripe/webhook</code> で Webhook も登録できます。
      </p>
    )
  }

  async function handleClick() {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { Accept: 'application/json' },
      })
      const data = (await res.json()) as { url?: string; error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Checkout を開始できませんでした')
        return
      }
      if (data.url) {
        window.location.href = data.url
        return
      }
      setError('URL が返されませんでした')
    } catch {
      setError('通信に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        className="btn btn--primary"
        disabled={disabled || loading}
        onClick={handleClick}
      >
        {loading ? 'Stripe へ移動中…' : 'Stripe Checkout で月額プランに申し込む'}
      </button>
      {error ? (
        <p className="alert alert--error" style={{ marginTop: '0.75rem' }} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
