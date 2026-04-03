import type { Prisma } from '@prisma/client'

export const MOVIES_PAGE_SIZE = 50

export function parseListPage(raw: string | undefined): number {
  const n = parseInt(raw ?? '1', 10)
  if (Number.isNaN(n) || n < 1) return 1
  return n
}

/** 総件数に合わせてページ番号を収める（はみ出し URL 対策） */
export function clampPage(page: number, totalFiltered: number): number {
  if (totalFiltered <= 0) return 1
  const totalPages = Math.ceil(totalFiltered / MOVIES_PAGE_SIZE)
  return Math.min(Math.max(1, page), totalPages)
}

/** PostgreSQL 用タイトル部分一致（大文字小文字無視） */
export function titleSearchWhere(query: string): Prisma.MovieWhereInput | undefined {
  const q = query.trim()
  if (!q) return undefined
  return { title: { contains: q, mode: 'insensitive' } }
}
