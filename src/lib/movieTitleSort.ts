import type { Prisma, PrismaClient } from '@prisma/client'
import { MOVIES_PAGE_SIZE } from '@/lib/moviesListPaging'

export type TitleScriptSortMode = 'default' | 'ja-first' | 'en-first'

export function parseTitleScriptSort(raw: string | undefined | null): TitleScriptSortMode {
  const v = raw?.trim()
  if (v === 'ja') return 'ja-first'
  if (v === 'en') return 'en-first'
  return 'default'
}

export function titleScriptToParam(mode: TitleScriptSortMode): string | undefined {
  if (mode === 'ja-first') return 'ja'
  if (mode === 'en-first') return 'en'
  return undefined
}

/** 先頭が英字 A–Z / a–z のとき「英語タイトル」グループとみなす */
export function titleStartsWithLatinScript(title: string): boolean {
  const trimmed = title.trim()
  if (!trimmed) return false
  const cp = trimmed.normalize('NFKC').codePointAt(0)
  if (cp === undefined) return false
  const ch = String.fromCodePoint(cp)
  return /^[A-Za-z]$/.test(ch)
}

export function compareTitlesByScriptOrder(
  a: string,
  b: string,
  mode: 'ja-first' | 'en-first'
): number {
  const la = titleStartsWithLatinScript(a)
  const lb = titleStartsWithLatinScript(b)
  const ordA = mode === 'ja-first' ? (la ? 1 : 0) : la ? 0 : 1
  const ordB = mode === 'ja-first' ? (lb ? 1 : 0) : lb ? 0 : 1
  if (ordA !== ordB) return ordA - ordB
  return a.localeCompare(b, 'ja', { sensitivity: 'base' })
}

type FindMoviesArgs<I extends Prisma.MovieFindManyArgs['include']> = {
  db: PrismaClient
  where: Prisma.MovieWhereInput
  include: I
  page: number
  mode: TitleScriptSortMode
}

export async function findMoviesPageWithTitleScriptOrder<I extends Prisma.MovieFindManyArgs['include']>(
  options: FindMoviesArgs<I>
): Promise<Prisma.MovieGetPayload<{ include: I }>[]> {
  const { db, where, include, page, mode } = options

  if (mode === 'default') {
    return db.movie.findMany({
      where,
      orderBy: { title: 'asc' },
      skip: (page - 1) * MOVIES_PAGE_SIZE,
      take: MOVIES_PAGE_SIZE,
      include,
    }) as Promise<Prisma.MovieGetPayload<{ include: I }>[]>
  }

  const scriptMode = mode === 'ja-first' ? 'ja-first' : 'en-first'
  const rows = await db.movie.findMany({
    where,
    select: { id: true, title: true },
  })
  rows.sort((x, y) => compareTitlesByScriptOrder(x.title, y.title, scriptMode))
  const slice = rows.slice((page - 1) * MOVIES_PAGE_SIZE, page * MOVIES_PAGE_SIZE)
  const ids = slice.map((r) => r.id)
  if (ids.length === 0) return []

  const order = new Map(ids.map((id, i) => [id, i]))
  const full = await db.movie.findMany({
    where: { id: { in: ids } },
    include,
  })
  full.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
  return full as Prisma.MovieGetPayload<{ include: I }>[]
}
