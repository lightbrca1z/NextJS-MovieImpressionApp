import { MoviesListContent } from '@/app/movies/movies-list-content'

type Props = { searchParams: Promise<{ q?: string; page?: string }> }

/** みんなの感想（映画グリッド・全ユーザーの件数） */
export default async function MoviesEveryonePage({ searchParams }: Props) {
  return <MoviesListContent variant="everyone" searchParams={searchParams} />
}
