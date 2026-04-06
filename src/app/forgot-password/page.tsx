import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { auth } from '@/auth'
import { ForgotPasswordForm } from '@/components/ForgotPasswordForm'

export const metadata = {
  title: 'パスワード再設定 — Movie Impression',
}

export const dynamic = 'force-dynamic'

export default async function ForgotPasswordPage() {
  const session = await auth()
  if (session?.user?.id) {
    redirect('/')
  }

  return (
    <>
      <h1 className="page-title">パスワードをお忘れの場合</h1>
      <p className="page-lead">
        登録したメールアドレスを入力してください。パスワード再設定用のリンクをお送りします。
      </p>
      <Suspense fallback={<div className="form-panel">フォームを読み込み中…</div>}>
        <ForgotPasswordForm />
      </Suspense>
      <p className="page-lead" style={{ marginTop: '1rem' }}>
        <Link href="/">トップへ戻る</Link>
      </p>
    </>
  )
}
