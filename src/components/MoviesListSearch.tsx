'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

type MoviesListSearchProps = {
  /** `home` のときだけ `/` に `q` を付与 */
  variant?: 'home' | 'movies'
  /**
   * URL 上の検索パラメータ名。
   * `allq` は `/movies?scope=mine` の下段「映画一覧」用（上段は `q`）
   */
  param?: 'q' | 'allq'
  /** アクセシビリティ用（同一ページに2フォームあるとき） */
  inputId?: string
}

/** 見出し右：タイトル絞り込み（現在の一覧ページの URL を維持） */
export function MoviesListSearch({
  variant = 'movies',
  param = 'q',
  inputId = 'movies-list-search-input',
}: MoviesListSearchProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [value, setValue] = useState('')

  useEffect(() => {
    setValue(searchParams.get(param) ?? '')
  }, [searchParams, param])

  function copyTitleScript(target: URLSearchParams) {
    const ts = searchParams.get('titleScript')
    if (ts === 'ja' || ts === 'en') target.set('titleScript', ts)
  }

  function submit(next: string) {
    const trimmed = next.trim()
    if (variant === 'home') {
      const p = new URLSearchParams()
      if (trimmed) p.set('q', trimmed)
      copyTitleScript(p)
      router.push(p.toString() ? `/?${p.toString()}` : '/')
      return
    }

    if (pathname === '/movies/everyone') {
      const p = new URLSearchParams()
      if (trimmed) p.set('q', trimmed)
      copyTitleScript(p)
      const qs = p.toString()
      router.push(qs ? `/movies/everyone?${qs}` : '/movies/everyone')
      return
    }

    if (pathname === '/movies') {
      const isMine = searchParams.get('scope') === 'mine'
      if (isMine) {
        const mp = new URLSearchParams()
        mp.set('scope', 'mine')
        if (param === 'allq') {
          if (trimmed) mp.set('allq', trimmed)
          const qKeep = searchParams.get('q')
          if (qKeep?.trim()) mp.set('q', qKeep.trim())
        } else {
          if (trimmed) mp.set('q', trimmed)
          const allqKeep = searchParams.get('allq')
          if (allqKeep?.trim()) mp.set('allq', allqKeep.trim())
        }
        copyTitleScript(mp)
        const s = mp.toString()
        router.push(s ? `/movies?${s}` : '/movies?scope=mine')
        return
      }
      const p = new URLSearchParams()
      if (trimmed) p.set('q', trimmed)
      copyTitleScript(p)
      const qs = p.toString()
      router.push(qs ? `/movies?${qs}` : '/movies')
      return
    }

    const p = new URLSearchParams()
    if (trimmed) p.set('q', trimmed)
    copyTitleScript(p)
    const qs = p.toString()
    router.push(qs ? `/movies?${qs}` : '/movies')
  }

  return (
    <form
      className="movies-list-search"
      onSubmit={(e) => {
        e.preventDefault()
        submit(value)
      }}
      role="search"
    >
      <label htmlFor={inputId} className="visually-hidden">
        映画タイトルで検索
      </label>
      <input
        id={inputId}
        name={param}
        type="search"
        placeholder="映画を検索…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoComplete="off"
        enterKeyHint="search"
      />
      <button type="submit" className="movies-list-search__submit">
        検索
      </button>
    </form>
  )
}
