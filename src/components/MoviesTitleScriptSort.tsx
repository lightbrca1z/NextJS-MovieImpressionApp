'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

/** 一覧の並び: 日本語系タイトル先 / 英語タイトル先（URL は titleScript=ja | en） */
export function MoviesTitleScriptSort() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const current = searchParams.get('titleScript')
  const activeJa = current === 'ja'
  const activeEn = current === 'en'

  function href(next: 'ja' | 'en' | 'default'): string {
    const p = new URLSearchParams(searchParams.toString())

    if (next === 'default') {
      p.delete('titleScript')
    } else {
      p.set('titleScript', next)
    }
    p.delete('page')
    p.delete('allPage')
    p.delete('myPage')

    const qs = p.toString()

    if (pathname === '/') {
      return qs ? `/?${qs}` : '/'
    }
    if (pathname === '/movies/everyone') {
      return qs ? `/movies/everyone?${qs}` : '/movies/everyone'
    }
    if (pathname === '/movies') {
      return qs ? `/movies?${qs}` : '/movies'
    }

    return qs ? `/movies?${qs}` : '/movies'
  }

  const showClear = current === 'ja' || current === 'en'

  return (
    <div className="movies-title-script-sort" role="group" aria-label="タイトルの表示順">
      <span className="movies-title-script-sort__label">並び:</span>
      <Link
        href={href('ja')}
        className={
          activeJa
            ? 'movies-title-script-sort__btn movies-title-script-sort__btn--active'
            : 'movies-title-script-sort__btn'
        }
        aria-current={activeJa ? 'true' : undefined}
      >
        日本語先
      </Link>
      <Link
        href={href('en')}
        className={
          activeEn
            ? 'movies-title-script-sort__btn movies-title-script-sort__btn--active'
            : 'movies-title-script-sort__btn'
        }
        aria-current={activeEn ? 'true' : undefined}
      >
        英語先
      </Link>
      {showClear ? (
        <Link href={href('default')} className="movies-title-script-sort__clear">
          標準
        </Link>
      ) : null}
    </div>
  )
}
