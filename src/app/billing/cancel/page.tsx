import Link from 'next/link'

export const metadata = {
  title: 'お支払いキャンセル — Movie Impression',
}

export default function BillingCancelPage() {
  return (
    <>
      <h1 className="page-title">お支払いをキャンセルしました</h1>
      <p className="page-lead">Stripe Checkout を完了しなかったため、契約はありません。</p>
      <p className="page-lead">
        <Link href="/pricing">料金プランへ</Link> · <Link href="/">トップへ</Link>
      </p>
    </>
  )
}
