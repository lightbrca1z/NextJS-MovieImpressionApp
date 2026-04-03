import Link from 'next/link'

type Props = {
  featureLabel?: string
}

export function PaywallNotice({ featureLabel }: Props) {
  return (
    <div className="paywall-notice" role="status">
      <p className="paywall-notice__title">
        {featureLabel ? (
          <>
            「<strong>{featureLabel}</strong>」は月額プラン加入後にご利用いただけます。
          </>
        ) : (
          <>この機能は月額プラン加入後にご利用いただけます。</>
        )}
      </p>
      <p className="paywall-notice__body">
        Checkout 完了後は <strong>Webhook</strong> で DB が更新され、数秒以内に投稿・追加が可能になります（成功画面だけでは未反映のことがあります）。
      </p>
      <Link href="/pricing" className="btn btn--primary paywall-notice__cta">
        料金プランを見る
      </Link>
    </div>
  )
}
