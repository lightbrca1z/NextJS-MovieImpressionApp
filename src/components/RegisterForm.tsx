'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export function RegisterForm() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setPending(true)
    const fd = new FormData(e.currentTarget)
    const name = String(fd.get('name'))
    const email = String(fd.get('email'))
    const password = String(fd.get('password'))

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setPending(false)
      setError(data.error ?? '登録に失敗しました')
      return
    }

    const sign = await signIn('credentials', { email, password, redirect: false })
    setPending(false)
    if (sign?.error) {
      router.push('/login')
      return
    }
    router.push('/')
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
        <label htmlFor="name">表示名</label>
        <input id="name" name="name" type="text" autoComplete="name" required />
      </div>
      <div className="form-group">
        <label htmlFor="email">メールアドレス</label>
        <input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="form-group">
        <label htmlFor="password">パスワード（4文字以上）</label>
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={4} required />
      </div>
      <div className="actions-row">
        <button type="submit" className="btn btn--primary" disabled={pending}>
          {pending ? '登録中…' : '登録してログイン'}
        </button>
        <Link href="/login">ログインへ</Link>
      </div>
    </form>
  )
}
