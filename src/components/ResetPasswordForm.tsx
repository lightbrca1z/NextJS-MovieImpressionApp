'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')?.trim() ?? ''
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    if (!token) {
      setError('リンクが無効です。')
      return
    }
    const fd = new FormData(e.currentTarget)
    const password = String(fd.get('password'))
    const confirm = String(fd.get('confirm'))
    if (password !== confirm) {
      setError('パスワードが一致しません')
      return
    }
    setPending(true)
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })
    const data = await res.json().catch(() => ({}))
    setPending(false)
    if (!res.ok) {
      setError(data.error ?? '更新に失敗しました')
      return
    }
    router.push('/login?reset=1')
    router.refresh()
  }

  if (!token) {
    return (
      <div className="form-panel">
        <div className="alert alert--error" role="alert">
          再設定用のリンクが見つかりません。メール内のリンクから開くか、もう一度手続きをやり直してください。
        </div>
        <p className="page-lead">
          <Link href="/forgot-password">パスワード再設定をやり直す</Link>
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="form-panel">
      {error ? (
        <div className="alert alert--error" role="alert">
          {error}
        </div>
      ) : null}
      <div className="form-group">
        <label htmlFor="reset-password">新しいパスワード（4文字以上）</label>
        <input
          id="reset-password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={4}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="reset-confirm">新しいパスワード（確認）</label>
        <input
          id="reset-confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          minLength={4}
          required
        />
      </div>
      <div className="actions-row">
        <button type="submit" className="btn btn--primary" disabled={pending}>
          {pending ? '更新中…' : 'パスワードを更新'}
        </button>
        <Link href="/">トップへ</Link>
      </div>
    </form>
  )
}
