import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { auth } from '@/auth'
import { LoginForm } from '@/components/LoginForm'

export const metadata = {
  title: 'ログイン — Movie Impression',
}

type Props = { searchParams: Promise<{ reset?: string }> }

export default async function LoginPage({ searchParams }: Props) {
  const session = await auth()
  if (session?.user?.id) {
    redirect('/')
  }

  const sp = await searchParams
  const passwordResetDone = sp.reset === '1'

  return (
    <>
      <h1 className="page-title">ログイン</h1>
      <p className="page-lead">
        メールアドレス、または管理者のログイン ID（<strong>Manager</strong>）でサインインできます。
      </p>
      {passwordResetDone ? (
        <div className="alert alert--success" role="status" style={{ marginBottom: '1rem' }}>
          パスワードを更新しました。新しいパスワードでログインしてください。
        </div>
      ) : null}
      <Suspense fallback={<div className="form-panel">フォームを読み込み中…</div>}>
        <LoginForm />
      </Suspense>
      <p className="page-lead" style={{ marginTop: '1rem' }}>
        <Link href="/">トップへ戻る</Link>
      </p>
    </>
  )
}
