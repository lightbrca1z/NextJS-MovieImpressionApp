'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/'
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setPending(true)
    const fd = new FormData(e.currentTarget)
    const email = String(fd.get('email'))
    const password = String(fd.get('password'))
    const res = await signIn('credentials', { email, password, redirect: false })
    setPending(false)
    if (res?.error) {
      setError('メールアドレスまたはパスワードが正しくありません')
      return
    }
    router.push(callbackUrl)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="form-panel">
      {error ? (
        <div className="alert alert--error" role="alert">
          {error}
        </div>
      ) : null}
      <div className="form-group">
        <label htmlFor="email">メールアドレス（管理者は Manager）</label>
        <input
          id="email"
          name="email"
          type="text"
          inputMode="email"
          autoComplete="username"
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="password">パスワード</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <div className="actions-row">
        <button type="submit" className="btn btn--primary" disabled={pending}>
          {pending ? 'ログイン中…' : 'ログイン'}
        </button>
        <Link href="/register">アカウントを作成</Link>
      </div>
      <p className="page-lead" style={{ marginTop: '1rem', marginBottom: 0 }}>
        <Link href="/forgot-password">パスワードをお忘れの方</Link>
      </p>
    </form>
  )
}
