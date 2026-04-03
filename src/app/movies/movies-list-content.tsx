import type { Prisma } from '@prisma/client'
import Link from 'next/link'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { MoviesListSearch } from '@/components/MoviesListSearch'
import { MoviesTitleScriptSort } from '@/components/MoviesTitleScriptSort'
import { MoviesPagination } from '@/components/MoviesPagination'
import { movieDetailPath } from '@/lib/moviePath'
import { findMoviesPageWithTitleScriptOrder, parseTitleScriptSort, titleScriptToParam } from '@/lib/movieTitleSort'
import { MOVIES_PAGE_SIZE, clampPage, parseListPage, titleSearchWhere } from '@/lib/moviesListPaging'

export type MoviesListVariant = 'catalog' | 'everyone' | 'mine'

type SearchInput = { q?: string; allq?: string; page?: string; allPage?: string; titleScript?: string }

type Props = {
  variant: MoviesListVariant
  searchParams: Promise<SearchInput>
}

type MovieWithReviewCount = Prisma.MovieGetPayload<{
  include: { _count: { select: { reviews: true } } }
}>

export async function MoviesListContent({ variant, searchParams }: Props) {
  const { q, allq, page: pageRaw, allPage: allPageRaw, titleScript: titleScriptRaw } = await searchParams
  const query = (q ?? '').trim()
  const allQuery = (allq ?? '').trim()
  const page = parseListPage(pageRaw)
  const allPage = parseListPage(allPageRaw)
  const titleSortMode = parseTitleScriptSort(titleScriptRaw)
  const titleScriptParam = titleScriptToParam(titleSortMode)
  const session = await auth()
  const mineOnly = variant === 'mine'

  if (mineOnly && !session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent('/movies?scope=mine')}`)
  }

  const uid = session?.user?.id

  const titleQ = titleSearchWhere(query)
  const titleAllQ = titleSearchWhere(allQuery)

  const basePath = variant === 'everyone' ? '/movies/everyone' : '/movies'

  /** 上段：自分の投稿 */
  let mainMovies: MovieWithReviewCount[] = []
  let mainTotalFiltered = 0
  let mainTotalUnfiltered = 0

  let safeMainPage = 1

  if (mineOnly && uid) {
    const baseWhere = { reviews: { some: { userId: uid } } }
    mainTotalUnfiltered = await prisma.movie.count({ where: baseWhere })
    const whereMain = { ...baseWhere, ...(titleQ ?? {}) }
    mainTotalFiltered = await prisma.movie.count({ where: whereMain })
    safeMainPage = clampPage(page, mainTotalFiltered)
    mainMovies = await findMoviesPageWithTitleScriptOrder({
      db: prisma,
      where: whereMain,
      page: safeMainPage,
      mode: titleSortMode,
      include: {
        _count: {
          select: {
            reviews: { where: { userId: uid } },
          },
        },
      },
    })
  } else if (!mineOnly) {
    mainTotalUnfiltered = await prisma.movie.count({ where: {} })
    const whereCatalog = { ...(titleQ ?? {}) }
    mainTotalFiltered = await prisma.movie.count({ where: whereCatalog })
    safeMainPage = clampPage(page, mainTotalFiltered)
    mainMovies = await findMoviesPageWithTitleScriptOrder({
      db: prisma,
      where: whereCatalog,
      page: safeMainPage,
      mode: titleSortMode,
      include: {
        _count: { select: { reviews: true } },
      },
    })
  }

  /** 下段：全映画カタログ（自分の感想ページのみ） */
  let allCatalogMovies: MovieWithReviewCount[] = []
  let allCatalogTotalFiltered = 0
  let allCatalogTotalUnfiltered = 0

  let safeAllPage = 1

  if (mineOnly) {
    allCatalogTotalUnfiltered = await prisma.movie.count({ where: {} })
    const whereAll = { ...(titleAllQ ?? {}) }
    allCatalogTotalFiltered = await prisma.movie.count({ where: whereAll })
    safeAllPage = clampPage(allPage, allCatalogTotalFiltered)
    allCatalogMovies = await findMoviesPageWithTitleScriptOrder({
      db: prisma,
      where: whereAll,
      page: safeAllPage,
      mode: titleSortMode,
      include: {
        _count: { select: { reviews: true } },
      },
    })
  }

  const leadBody =
    variant === 'mine' ? (
      <>
        ヘッダーの「自分の感想」表示中。上段はあなたが投稿した映画だけ、下段はサイトに登録されている全映画です。上段の件数はあなたの投稿数、下段は全ユーザーの感想の合計です。一覧は1ページあたり {MOVIES_PAGE_SIZE} 件です。
      </>
    ) : variant === 'everyone' ? (
      <>
        ヘッダーの「みんなの感想」表示中。登録されている映画がすべて並び、件数は全ユーザーの感想の合計です。1ページあたり {MOVIES_PAGE_SIZE} 件です。
      </>
    ) : (
      <>
        ヘッダーの「映画一覧」表示中。登録されている映画がすべて並びます。件数は全ユーザーの感想の合計です。1ページあたり {MOVIES_PAGE_SIZE} 件です。
      </>
    )

  const sectionTitle =
    variant === 'mine'
      ? '自分の投稿'
      : variant === 'everyone'
        ? '映画一覧(みんなの投稿)'
        : '映画一覧'

  const filterScopeNote =
    variant === 'mine' ? ' 表示は「自分の投稿」一覧です。' : variant === 'everyone' ? ' 表示は「みんなの感想」ページです。' : ' 表示は「映画一覧」です。'

  const catalogFilterNote = ' 表示は下段の「映画一覧」（全映画）です。'

  const mainExtraParams: Record<string, string | undefined> =
    variant === 'mine'
      ? {
          scope: 'mine',
          ...(query ? { q: query } : {}),
          ...(allQuery ? { allq: allQuery } : {}),
          ...(safeAllPage > 1 ? { allPage: String(safeAllPage) } : {}),
          ...(titleScriptParam ? { titleScript: titleScriptParam } : {}),
        }
      : {
          ...(query ? { q: query } : {}),
          ...(titleScriptParam ? { titleScript: titleScriptParam } : {}),
        }

  const catalogExtraParams: Record<string, string | undefined> = {
    scope: 'mine',
    ...(query ? { q: query } : {}),
    ...(allQuery ? { allq: allQuery } : {}),
    ...(safeMainPage > 1 ? { page: String(safeMainPage) } : {}),
    ...(titleScriptParam ? { titleScript: titleScriptParam } : {}),
  }

  return (
    <>
      <h1 className="page-title">映画感想を、母国語と学習言語で残そう</h1>
      <p className="page-lead">
        {leadBody}
        {variant === 'mine' ? (
          <> それぞれの見出しの右からタイトル検索できます（上段・下段で別々に絞り込めます）。</>
        ) : (
          <> 下の「映画一覧」の右からタイトル検索もできます。</>
        )}
      </p>

      <section aria-labelledby="movies-heading">
        <div className="movies-page__heading-row">
          <h2
            id="movies-heading"
            className="page-title movies-page__title movies-page__title--section"
          >
            {sectionTitle}
          </h2>
          <div className="movies-page__tools">
            <Suspense fallback={<div className="movies-title-script-sort movies-title-script-sort--skeleton" aria-hidden />}>
              <MoviesTitleScriptSort />
            </Suspense>
            <Suspense fallback={<div className="movies-list-search movies-list-search--skeleton" aria-hidden />}>
              <MoviesListSearch
                param="q"
                inputId={mineOnly ? 'movies-mine-search-q' : 'movies-list-search-input'}
              />
            </Suspense>
          </div>
        </div>
        {query ? (
          <p className="page-lead movies-page__filter-note">
            検索「<strong>{query}</strong>」で絞り込み中（タイトルに部分一致、大文字・小文字は区別しません）。
            {filterScopeNote}
          </p>
        ) : null}
        {mainTotalFiltered === 0 ? (
          <p className="page-lead">
            {query && mainTotalUnfiltered > 0
              ? '検索に一致する映画がありません。別のキーワードを試してください。'
              : mineOnly
                ? 'まだ投稿した映画がありません。映画を追加するか、他の映画ページから感想を投稿してください。下の「映画一覧」から映画を選ぶこともできます。'
                : 'まだ映画がありません。ログインして「映画を追加」から登録してください。'}
          </p>
        ) : (
          <>
            <div className="movie-grid">
              {mainMovies.map((m) => (
                <Link key={m.id} href={movieDetailPath(m.slug)} className="movie-tile">
                  <h3 className="movie-tile__title">{m.title}</h3>
                  <p className="movie-tile__count">感想 {m._count.reviews} 件</p>
                </Link>
              ))}
            </div>
            <MoviesPagination
              currentPage={safeMainPage}
              totalCount={mainTotalFiltered}
              basePath={basePath}
              extraParams={mainExtraParams}
            />
          </>
        )}
      </section>

      {mineOnly ? (
        <section className="movies-page__secondary-section" aria-labelledby="movies-catalog-all-heading">
          <div className="movies-page__heading-row">
            <h2
              id="movies-catalog-all-heading"
              className="page-title movies-page__title movies-page__title--section"
            >
              映画一覧
            </h2>
            <Suspense fallback={<div className="movies-list-search movies-list-search--skeleton" aria-hidden />}>
              <MoviesListSearch param="allq" inputId="movies-mine-search-allq" />
            </Suspense>
          </div>
          <p className="page-lead movies-page__secondary-lead">
            投稿の有無にかかわらず登録されているすべての映画です。上段と同じ並び（日本語先／英語先／標準）がここにも適用されます。感想がまだの作品からも投稿できます。1ページあたり {MOVIES_PAGE_SIZE} 件です。
          </p>
          {allQuery ? (
            <p className="page-lead movies-page__filter-note">
              検索「<strong>{allQuery}</strong>」で絞り込み中（タイトルに部分一致、大文字・小文字は区別しません）。
              {catalogFilterNote}
            </p>
          ) : null}
          {allCatalogTotalFiltered === 0 ? (
            <p className="page-lead">
              {allQuery && allCatalogTotalUnfiltered > 0
                ? '検索に一致する映画がありません。別のキーワードを試してください。'
                : 'まだ映画がありません。'}
            </p>
          ) : (
            <>
              <div className="movie-grid">
                {allCatalogMovies.map((m) => (
                  <Link key={m.id} href={movieDetailPath(m.slug)} className="movie-tile">
                    <h3 className="movie-tile__title">{m.title}</h3>
                    <p className="movie-tile__count">感想 {m._count.reviews} 件</p>
                  </Link>
                ))}
              </div>
              <MoviesPagination
                paramName="allPage"
                currentPage={safeAllPage}
                totalCount={allCatalogTotalFiltered}
                basePath="/movies"
                extraParams={catalogExtraParams}
              />
            </>
          )}
        </section>
      ) : null}
    </>
  )
}
