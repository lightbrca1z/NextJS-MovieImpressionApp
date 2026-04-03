'use server'

import type { Prisma, PrismaClient } from '@prisma/client'
import { auth } from '@/auth'
import { CSV_MOVIE_IMPORT_MAX, extractMovieTitlesFromCsv } from '@/lib/csvMovieTitles'
import { prisma } from '@/lib/prisma'
import { allocateMovieSlug, isAsciiUrlSlug } from '@/lib/movieSlug'
import { isAdminRole, ADMIN_ONLY_MOVIES_NEW_MESSAGE } from '@/lib/roles'
import { revalidatePath } from 'next/cache'

export type MovieActionState = { error?: string; slug?: string }

export type CsvMovieImportState = {
  error?: string
  added?: number
  skippedDuplicateInFile?: number
}

export type RepairMovieSlugsState = {
  error?: string
  fixed?: number
}

const CSV_MAX_BYTES = 2 * 1024 * 1024

async function createMovieRecord(
  title: string,
  db: Prisma.TransactionClient | PrismaClient
): Promise<string> {
  const t = title.trim()
  if (!t) throw new Error('empty title')
  const slug = await allocateMovieSlug(t, db)
  await db.movie.create({
    data: { title: t, slug },
  })
  return slug
}

function revalidateMovieLists() {
  revalidatePath('/')
  revalidatePath('/movies')
  revalidatePath('/movies/everyone')
}

export async function createMovie(
  _prev: MovieActionState,
  formData: FormData
): Promise<MovieActionState> {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'ログインが必要です' }
  }

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true } })
  if (!dbUser) {
    return {
      error:
        'ログイン情報がデータベースと一致しません（DB を入れ替えた直後など）。一度ログアウトして、もう一度ログインしてください。',
    }
  }

  if (!isAdminRole(session.user.role)) {
    return { error: ADMIN_ONLY_MOVIES_NEW_MESSAGE }
  }

  const title = String(formData.get('title') ?? '').trim()
  if (!title) {
    return { error: '映画タイトルを入力してください' }
  }

  const slug = await createMovieRecord(title, prisma)

  revalidateMovieLists()
  return { slug }
}

export async function importMoviesFromCsv(
  _prev: CsvMovieImportState,
  formData: FormData
): Promise<CsvMovieImportState> {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'ログインが必要です' }
  }

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true } })
  if (!dbUser) {
    return {
      error:
        'ログイン情報がデータベースと一致しません（DB を入れ替えた直後など）。一度ログアウトして、もう一度ログインしてください。',
    }
  }

  if (!isAdminRole(session.user.role)) {
    return { error: ADMIN_ONLY_MOVIES_NEW_MESSAGE }
  }

  const file = formData.get('csv')
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'CSV ファイルを選択してください' }
  }
  if (file.size > CSV_MAX_BYTES) {
    return { error: 'ファイルは 2MB 以下にしてください' }
  }

  let text: string
  try {
    text = await file.text()
  } catch {
    return { error: 'ファイルの読み込みに失敗しました' }
  }

  const rawTitles = extractMovieTitlesFromCsv(text)
  const seen = new Set<string>()
  const titles: string[] = []
  let skippedDuplicateInFile = 0
  for (const raw of rawTitles) {
    const t = raw.trim()
    const key = t.toLowerCase()
    if (seen.has(key)) {
      skippedDuplicateInFile++
      continue
    }
    seen.add(key)
    titles.push(t)
  }

  if (titles.length === 0) {
    return { error: '取り込めるタイトルがありません（1 列目にタイトルがある行を含めてください）' }
  }
  if (titles.length > CSV_MOVIE_IMPORT_MAX) {
    return { error: `一度に取り込めるのは ${CSV_MOVIE_IMPORT_MAX} 件までです（現在 ${titles.length} 件）` }
  }

  let added = 0
  await prisma.$transaction(async (tx) => {
    for (const title of titles) {
      await createMovieRecord(title, tx)
      added++
    }
  })

  revalidateMovieLists()
  return {
    added,
    skippedDuplicateInFile,
  }
}

export async function repairNonAsciiMovieSlugs(
  _prev: RepairMovieSlugsState,
  _formData: FormData
): Promise<RepairMovieSlugsState> {
  void _prev
  void _formData
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'ログインが必要です' }
  }

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true } })
  if (!dbUser) {
    return {
      error:
        'ログイン情報がデータベースと一致しません（DB を入れ替えた直後など）。一度ログアウトして、もう一度ログインしてください。',
    }
  }

  if (!isAdminRole(session.user.role)) {
    return { error: ADMIN_ONLY_MOVIES_NEW_MESSAGE }
  }

  const rows = await prisma.movie.findMany({
    select: { id: true, title: true, slug: true },
    orderBy: { id: 'asc' },
  })

  let fixed = 0
  await prisma.$transaction(async (tx) => {
    for (const m of rows) {
      if (isAsciiUrlSlug(m.slug)) continue
      const newSlug = await allocateMovieSlug(m.title, tx)
      await tx.movie.update({ where: { id: m.id }, data: { slug: newSlug } })
      fixed++
    }
  })

  revalidateMovieLists()
  for (const m of rows) {
    if (!isAsciiUrlSlug(m.slug)) {
      revalidatePath(`/movies/${m.slug}`)
    }
  }

  return { fixed }
}
