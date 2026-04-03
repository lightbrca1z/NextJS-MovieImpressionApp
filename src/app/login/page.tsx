import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { auth } from '@/auth'
import { LoginForm } from '@/components/LoginForm'

export const metadata = {
  title: 'ログイン — Movie Impression',
}

export default async function LoginPage() {
  const session = await auth()
  if (session?.user?.id) {
    redirect('/')
  }

  return (
    <>
      <h1 className="page-title">ログイン</h1>
      <p className="page-lead">
        メールアドレス、または管理者のログイン ID（<strong>Manager</strong>）でサインインできます。
      </p>
      <Suspense fallback={<div className="form-panel">フォームを読み込み中…</div>}>
        <LoginForm />
      </Suspense>
      <p className="page-lead" style={{ marginTop: '1rem' }}>
        <Link href="/">トップへ戻る</Link>
      </p>
    </>
  )
}
