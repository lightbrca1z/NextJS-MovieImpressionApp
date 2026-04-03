'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createMovie, type MovieActionState } from '@/app/actions/movies'
import { movieWritePath } from '@/lib/moviePath'

const initial: MovieActionState = {}

export function MovieCreateForm() {
  const router = useRouter()
  const [state, action, pending] = useActionState(createMovie, initial)

  useEffect(() => {
    if (state.slug) {
      router.push(movieWritePath(state.slug))
    }
  }, [state.slug, router])

  return (
    <form action={action} className="form-panel">
      {state.error ? (
        <div className="alert alert--error" role="alert">
          {state.error}
        </div>
      ) : null}
      <div className="form-group">
        <label htmlFor="movie-title">映画タイトル</label>
        <input id="movie-title" name="title" type="text" required placeholder="例: Night at the Museum" />
        <p className="form-hint">登録後、同じ画面で感想（日英）を投稿できます。</p>
      </div>
      <div className="actions-row">
        <button type="submit" className="btn btn--primary" disabled={pending}>
          {pending ? '登録中…' : '映画を登録して感想を書く'}
        </button>
      </div>
    </form>
  )
}
