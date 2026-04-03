'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

function withQ(basePath: string, sp: { get: (key: string) => string | null }) {
  const q = sp.get('q')
  if (!q) return basePath
  const p = new URLSearchParams()
  p.set('q', q)
  return `${basePath}?${p.toString()}`
}

/** 映画一覧・自分の感想・みんなの感想（見た目を app-header__link で統一） */
export function HeaderMoviesNav({ isLoggedIn }: { isLoggedIn: boolean }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const mine = searchParams.get('scope') === 'mine'

  const hrefCatalog = withQ('/movies', searchParams)
  const hrefEveryone = withQ('/movies/everyone', searchParams)
  const hrefMineParams = new URLSearchParams()
  hrefMineParams.set('scope', 'mine')
  const q = searchParams.get('q')
  if (q) hrefMineParams.set('q', q)
  const allq = searchParams.get('allq')
  if (allq) hrefMineParams.set('allq', allq)
  const hrefMine = `/movies?${hrefMineParams.toString()}`

  const catalogActive = pathname === '/movies' && !mine
  const everyoneActive = pathname === '/movies/everyone'
  const mineActive = pathname === '/movies' && mine

  return (
    <>
      <Link
        href={hrefCatalog}
        className={catalogActive ? 'app-header__link app-header__link--active' : 'app-header__link'}
      >
        映画一覧
      </Link>
      {isLoggedIn ? (
        <Link href={hrefMine} className={mineActive ? 'app-header__link app-header__link--active' : 'app-header__link'}>
          自分の感想
        </Link>
      ) : (
        <Link
          href={`/login?callbackUrl=${encodeURIComponent(hrefMine)}`}
          className={mineActive ? 'app-header__link app-header__link--active' : 'app-header__link'}
          title="ログインすると、あなたが投稿した映画だけ表示されます"
        >
          自分の感想
        </Link>
      )}
      <Link
        href={hrefEveryone}
        className={everyoneActive ? 'app-header__link app-header__link--active' : 'app-header__link'}
      >
        みんなの感想
      </Link>
    </>
  )
}
