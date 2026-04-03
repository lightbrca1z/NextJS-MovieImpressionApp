import Link from 'next/link'
import { Suspense } from 'react'
import type { Session } from 'next-auth'
import { SignOutButton } from '@/components/SignOutButton'
import { HeaderMoviesNav } from '@/components/HeaderMoviesNav'
import { isAdminRole } from '@/lib/roles'

export function AppHeader({ session }: { session: Session | null }) {
  return (
    <header className="app-header">
      <div className="app-header__inner">
        <Link href="/" className="app-header__brand">
          Movie Impression
        </Link>
        <nav className="app-header__nav" aria-label="メイン">
          <Suspense
            fallback={
              <>
                <span className="app-header__link app-header__link--skeleton" aria-hidden>
                  映画一覧
                </span>
                <span className="app-header__link app-header__link--skeleton" aria-hidden>
                  自分の感想
                </span>
                <span className="app-header__link app-header__link--skeleton" aria-hidden>
                  みんなの感想
                </span>
              </>
            }
          >
            <HeaderMoviesNav isLoggedIn={Boolean(session?.user)} />
          </Suspense>
          <Link href="/pricing" className="app-header__link">
            料金
          </Link>
          {session?.user ? (
            <>
              {isAdminRole(session.user.role) ? (
                <Link href="/movies/new" className="app-header__link">
                  映画を追加
                </Link>
              ) : null}
              <span className="app-header__user">{session.user.name}</span>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="app-header__link">
                ログイン
              </Link>
              <Link href="/register" className="app-header__cta">
                新規登録
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
