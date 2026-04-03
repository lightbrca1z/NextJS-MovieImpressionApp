import { redirect } from 'next/navigation'
import { MoviesListContent } from '@/app/movies/movies-list-content'

type Props = {
  searchParams: Promise<{
    scope?: string
    q?: string
    allq?: string
    page?: string
    allPage?: string
    titleScript?: string
  }>
}

/** 映画一覧（`/movies`）と 自分の感想（`/movies?scope=mine`） */
export default async function MoviesPage({ searchParams }: Props) {
  const sp = await searchParams

  if (sp.scope === 'all') {
    const p = new URLSearchParams()
    const qq = (sp.q ?? '').trim()
    if (qq) p.set('q', qq)
    const ts = (sp.titleScript ?? '').trim()
    if (ts === 'ja' || ts === 'en') p.set('titleScript', ts)
    const qs = p.toString()
    redirect(qs ? `/movies?${qs}` : '/movies')
  }

  if (sp.scope === 'mine') {
    return <MoviesListContent variant="mine" searchParams={searchParams} />
  }

  return <MoviesListContent variant="catalog" searchParams={searchParams} />
}
