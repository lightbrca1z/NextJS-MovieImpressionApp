'use client'

import { useActionState } from 'react'
import { repairNonAsciiMovieSlugs, type RepairMovieSlugsState } from '@/app/actions/movies'

const initial: RepairMovieSlugsState = {}

export function MovieSlugRepairForm() {
  const [state, action, pending] = useActionState(repairNonAsciiMovieSlugs, initial)

  return (
    <form action={action} className="form-panel">
      <h2 className="page-title movies-page__title movies-page__title--section">スラッグの修復</h2>
      <p className="page-lead">
        過去に取り込んだ映画で、URL に日本語などが含まれるスラッグがあると、環境によって詳細ページや感想投稿へ進めないことがあります。タイトルはそのままに、
        <strong>英数字の URL 用スラッグだけ</strong>を付け直します。
      </p>
      {state.error ? (
        <div className="alert alert--error" role="alert">
          {state.error}
        </div>
      ) : null}
      {state.fixed != null && state.fixed > 0 ? (
        <div className="alert alert--success" role="status">
          <strong>{state.fixed}</strong> 件のスラッグを更新しました。映画一覧から開き直してください。
        </div>
      ) : null}
      {state.fixed === 0 && !state.error ? (
        <div className="alert alert--success" role="status">
          修復の必要がある映画はありませんでした。
        </div>
      ) : null}
      <div className="actions-row">
        <button type="submit" className="btn btn--primary" disabled={pending}>
          {pending ? '実行中…' : 'スラッグを英数字 URL に修復'}
        </button>
      </div>
    </form>
  )
}
