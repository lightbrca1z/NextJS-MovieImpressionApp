import Link from 'next/link'
import { Suspense } from 'react'
import { auth } from '@/auth'
import { LoginForm } from '@/components/LoginForm'
import { prisma } from '@/lib/prisma'
import { MoviesListSearch } from '@/components/MoviesListSearch'
import { MoviesPagination } from '@/components/MoviesPagination'
import { movieDetailPath } from '@/lib/moviePath'
import { MOVIES_PAGE_SIZE, clampPage, parseListPage, titleSearchWhere } from '@/lib/moviesListPaging'

type Props = { searchParams: Promise<{ q?: string; page?: string }> }

export default async function HomePage({ searchParams }: Props) {
  const session = await auth()

  if (!session?.user?.id) {
    return (
      <>
        <h1 className="page-title">ログイン</h1>
        <p className="page-lead">
          Movie Impression にサインインして、映画ごとに母国語と学習言語で感想を投稿・閲覧しましょう。
        </p>
        <Suspense fallback={<div className="form-panel">フォームを読み込み中…</div>}>
          <LoginForm />
        </Suspense>
        <p className="page-lead" style={{ marginTop: '1.25rem' }}>
          アカウントがまだの方は <Link href="/register">新規登録</Link> へ。
        </p>
      </>
    )
  }

  const { q, page: pageRaw } = await searchParams
  const query = (q ?? '').trim()
  const page = parseListPage(pageRaw)

  const titleQ = titleSearchWhere(query)
  const totalUnfiltered = await prisma.movie.count({ where: {} })
  const whereList = { ...(titleQ ?? {}) }
  const totalFiltered = await prisma.movie.count({ where: whereList })
  const safePage = clampPage(page, totalFiltered)

  const movies = await prisma.movie.findMany({
    where: whereList,
    orderBy: { title: 'asc' },
    skip: (safePage - 1) * MOVIES_PAGE_SIZE,
    take: MOVIES_PAGE_SIZE,
    include: {
      _count: { select: { reviews: true } },
    },
  })

  type MovieRow = (typeof movies)[number]

  return (
    <>
      <h1 className="page-title">映画感想を、母国語と学習言語で残そう</h1>
      <p className="page-lead">
        ログインすると映画ごとに、母国語と学習言語を選んでバイリンガルの感想を投稿できます。ヘッダーの「自分の感想」「みんなの感想」で映画一覧の出し分けができます。ここから映画を選ぶと、その映画の全ユーザーの感想を閲覧できます。
        下の「映画一覧」の右からタイトル検索もできます。1ページあたり {MOVIES_PAGE_SIZE} 件表示します。
      </p>

      <section aria-labelledby="movies-heading">
        <div className="movies-page__heading-row">
          <h2
            id="movies-heading"
            className="page-title movies-page__title movies-page__title--section"
          >
            映画一覧
          </h2>
          <Suspense fallback={<div className="movies-list-search movies-list-search--skeleton" aria-hidden />}>
            <MoviesListSearch variant="home" />
          </Suspense>
        </div>
        {query ? (
          <p className="page-lead movies-page__filter-note">
            検索「<strong>{query}</strong>」で絞り込み中（タイトルに部分一致、大文字・小文字は区別しません）。
          </p>
        ) : null}
        {totalFiltered === 0 ? (
          <p className="page-lead">
            {query && totalUnfiltered > 0
              ? '検索に一致する映画がありません。別のキーワードを試してください。'
              : 'まだ映画がありません。ログインして「映画を追加」から登録してください。'}
          </p>
        ) : (
          <>
            <div className="movie-grid">
              {movies.map((m: MovieRow) => (
                <Link key={m.id} href={movieDetailPath(m.slug)} className="movie-tile">
                  <h3 className="movie-tile__title">{m.title}</h3>
                  <p className="movie-tile__count">感想 {m._count.reviews} 件</p>
                </Link>
              ))}
            </div>
            <MoviesPagination
              currentPage={safePage}
              totalCount={totalFiltered}
              basePath="/"
              extraParams={query ? { q: query } : {}}
            />
          </>
        )}
      </section>
    </>
  )
}
