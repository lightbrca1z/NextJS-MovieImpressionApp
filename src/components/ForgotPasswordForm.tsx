'use client'

import { useActionState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  requestPasswordResetAction,
  type ForgotPasswordState,
} from '@/app/forgot-password/actions'

const initial: ForgotPasswordState = {}

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, initial)
  const formRef = useRef<HTMLFormElement>(null)
  const statusRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const hasFeedback = Boolean(state?.error) || Boolean(state?.ok && state.message)
    if (!hasFeedback) return
    if (state?.ok && state.message) {
      formRef.current?.reset()
    }
    statusRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [state])

  return (
    <form ref={formRef} action={formAction} className="form-panel">
      <div className="form-group">
        <label htmlFor="forgot-email">登録時のメールアドレス</label>
        <input
          id="forgot-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={pending}
        />
      </div>
      <p className="page-lead" style={{ marginTop: 0, fontSize: '0.95rem' }}>
        案内メールのリンクから新しいパスワードを設定できます（1時間有効）。<code style={{ fontSize: '0.85em' }}>.env</code>{' '}
        に <code style={{ fontSize: '0.85em' }}>RESEND_API_KEY</code> または Gmail 用の{' '}
        <code style={{ fontSize: '0.85em' }}>SMTP_*</code> を設定すると実メールで届きます（例は{' '}
        <code style={{ fontSize: '0.85em' }}>.env.example</code>）。どちらも無い開発時だけ、ターミナルにリンクが出ます。
      </p>
      <div className="actions-row">
        <button type="submit" className="btn btn--primary" disabled={pending}>
          {pending ? '送信中…' : '再設定用メールを送る'}
        </button>
        <Link href="/">ログインへ戻る</Link>
      </div>
      <div ref={statusRef} className="forgot-password__status">
        {state?.error ? (
          <div className="alert alert--error" role="alert">
            {state.error}
          </div>
        ) : null}
        {state?.ok && state.message ? (
          <div id="forgot-password-feedback" className="alert alert--success" role="status">
            {state.message}
          </div>
        ) : null}
      </div>
    </form>
  )
}
