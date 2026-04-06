import Link from 'next/link'
import { MOVIES_PAGE_SIZE } from '@/lib/moviesListPaging'

type Props = {
  /** URL パラメータ名（下段カタログは `allPage`、みんなの感想ページの上段は `myPage`） */
  paramName?: 'page' | 'allPage' | 'myPage'
  currentPage: number
  totalCount: number
  basePath: string
  /** `page` / `allPage` 以外を維持（空値は付与しない） */
  extraParams: Record<string, string | undefined>
}

export function MoviesPagination({
  paramName = 'page',
  currentPage,
  totalCount,
  basePath,
  extraParams,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(totalCount / MOVIES_PAGE_SIZE))
  if (totalPages <= 1) return null

  function href(p: number): string {
    const sp = new URLSearchParams()
    for (const [k, v] of Object.entries(extraParams)) {
      if (v != null && v !== '') sp.set(k, v)
    }
    if (p > 1) sp.set(paramName, String(p))
    else sp.delete(paramName)
    const qs = sp.toString()
    return qs ? `${basePath}?${qs}` : basePath
  }

  const prev = currentPage > 1 ? currentPage - 1 : null
  const next = currentPage < totalPages ? currentPage + 1 : null
  const start = (currentPage - 1) * MOVIES_PAGE_SIZE + 1
  const end = Math.min(currentPage * MOVIES_PAGE_SIZE, totalCount)

  return (
    <nav className="movies-pagination" aria-label="ページ送り">
      <p className="movies-pagination__summary">
        {start}–{end} 件 / 全 {totalCount} 件（{totalPages} ページ中 {currentPage} ページ目）
      </p>
      <div className="movies-pagination__links">
        {prev != null ? (
          <Link href={href(prev)} className="movies-pagination__link" rel="prev">
            前へ
          </Link>
        ) : (
          <span className="movies-pagination__link movies-pagination__link--disabled" aria-disabled>
            前へ
          </span>
        )}
        {next != null ? (
          <Link href={href(next)} className="movies-pagination__link" rel="next">
            次へ
          </Link>
        ) : (
          <span className="movies-pagination__link movies-pagination__link--disabled" aria-disabled>
            次へ
          </span>
        )}
      </div>
    </nav>
  )
}
