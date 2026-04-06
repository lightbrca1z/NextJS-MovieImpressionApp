import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { auth } from '@/auth'
import { ResetPasswordForm } from '@/components/ResetPasswordForm'

export const metadata = {
  title: '新しいパスワードの設定 — Movie Impression',
}

export default async function ResetPasswordPage() {
  const session = await auth()
  if (session?.user?.id) {
    redirect('/')
  }

  return (
    <>
      <h1 className="page-title">新しいパスワードを設定</h1>
      <p className="page-lead">メール内のリンクから開いたページです。新しいパスワードを入力してください。</p>
      <Suspense fallback={<div className="form-panel">フォームを読み込み中…</div>}>
        <ResetPasswordForm />
      </Suspense>
      <p className="page-lead" style={{ marginTop: '1rem' }}>
        <Link href="/forgot-password">パスワード再設定をやり直す</Link>
        {' · '}
        <Link href="/">トップへ</Link>
      </p>
    </>
  )
}
