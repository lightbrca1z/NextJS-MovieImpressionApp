import Link from 'next/link'

export const metadata = {
  title: 'お支払い完了 — Movie Impression',
}

export default function BillingSuccessPage() {
  return (
    <>
      <h1 className="page-title">お支払い手続きが完了しました</h1>
      <p className="page-lead">
        <strong>有料プランの反映は Webhook による DB 更新が正</strong>です。この画面だけでは未反映のことがあります。同期は通常数秒〜数十秒です。反映後、
        <strong>感想の投稿が無制限</strong>になります（無料枠の 200 件制限が解除されます）。
      </p>
      <p className="page-lead">
        <Link href="/pricing">料金プランへ</Link> · <Link href="/">トップへ</Link>
      </p>
    </>
  )
}
