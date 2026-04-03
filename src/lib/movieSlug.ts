import { randomBytes } from 'crypto'
import type { Prisma, PrismaClient } from '@prisma/client'

/** タイトルからローマ字・数字ベースのベース文字列（空なら未使用） */
export function latinSlugBaseFromTitle(title: string): string {
  const ascii = title
    .trim()
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .replace(/-+/g, '-')
  return ascii.slice(0, 72)
}

function randomSlugSuffix(): string {
  return randomBytes(4).toString('hex')
}

/** URL パス用：英小文字・数字・ハイフンのみ（先頭末尾ハイフンなし） */
export function isAsciiUrlSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
}

/**
 * 新規映画用。日本語のみのタイトルでも衝突しにくい英数字スラッグを割り当てる。
 */
export async function allocateMovieSlug(
  title: string,
  db: Prisma.TransactionClient | PrismaClient
): Promise<string> {
  let base = latinSlugBaseFromTitle(title)
  if (!base) base = 'movie'
  let slug = base
  let guard = 0
  while (await db.movie.findUnique({ where: { slug } })) {
    guard++
    slug = `${base}-${randomSlugSuffix()}`
    if (guard > 200) {
      throw new Error('slug allocation failed')
    }
  }
  return slug
}

/** シード用：メモリ上の Set で一意にする（DB 未接続の一括生成向け） */
export function allocateMovieSlugForSeed(title: string, used: Set<string>): string {
  let base = latinSlugBaseFromTitle(title)
  if (!base) base = 'movie'
  let slug = base
  let guard = 0
  while (used.has(slug)) {
    guard++
    slug = `${base}-${randomSlugSuffix()}`
    if (guard > 200) {
      throw new Error('seed slug allocation failed')
    }
  }
  used.add(slug)
  return slug
}
