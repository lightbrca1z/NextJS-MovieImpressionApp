'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { canModifyReview } from '@/lib/reviewPermissions'
import { movieDetailPath } from '@/lib/moviePath'
import { parseReviewLanguagePair } from '@/lib/reviewLanguages'
import { FREE_TIER_REVIEW_LIMIT, getReviewPostGate } from '@/lib/subscription'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export type ReviewActionState = { error?: string; ok?: boolean; movieSlug?: string }

/** JWT の user.id が DB に無いとき（DB 切り替え・シードやり直し後など）に FK エラーを防ぐ */
async function ensureSessionUserExists(userId: string): Promise<boolean> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
  return Boolean(u)
}

const SESSION_STALE_ERROR =
  'ログイン情報がデータベースと一致しません（DB を入れ替えた直後など）。一度ログアウトして、もう一度ログインしてください。'

export async function createReview(
  _prev: ReviewActionState,
  formData: FormData
): Promise<ReviewActionState> {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'ログインが必要です' }
  }

  if (!(await ensureSessionUserExists(session.user.id))) {
    return { error: SESSION_STALE_ERROR }
  }

  const gate = await getReviewPostGate(session.user.id, session.user.role)
  if (!gate.ok) {
    return {
      error: `未課金では感想は最大 ${FREE_TIER_REVIEW_LIMIT} 件までです。/pricing から月額プランにご加入ください。`,
    }
  }

  const movieSlug = String(formData.get('movieSlug') ?? '').trim()
  const langNativeRaw = String(formData.get('langNative') ?? '')
  const langLearnRaw = String(formData.get('langLearn') ?? '')
  const langs = parseReviewLanguagePair(langNativeRaw, langLearnRaw)
  if (!langs.ok) {
    return { error: langs.error }
  }

  const titleJa = String(formData.get('titleJa') ?? '').trim()
  const bodyJa = String(formData.get('bodyJa') ?? '').trim()
  const titleEn = String(formData.get('titleEn') ?? '').trim()
  const bodyEn = String(formData.get('bodyEn') ?? '').trim()

  if (!movieSlug || !titleJa || !bodyJa || !titleEn || !bodyEn) {
    return { error: '母国語・学習言語それぞれのタイトルと本文はすべて必須です' }
  }

  const movie = await prisma.movie.findUnique({ where: { slug: movieSlug } })
  if (!movie) {
    return { error: '映画が見つかりません' }
  }

  await prisma.review.create({
    data: {
      userId: session.user.id,
      movieId: movie.id,
      titleJa,
      bodyJa,
      titleEn,
      bodyEn,
      langNative: langs.native,
      langLearn: langs.learn,
    },
  })

  revalidatePath(`/movies/${movieSlug}`)
  revalidatePath('/movies')
  revalidatePath('/movies/everyone')
  revalidatePath('/')
  return { ok: true, movieSlug }
}

export async function updateReview(
  _prev: ReviewActionState,
  formData: FormData
): Promise<ReviewActionState> {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'ログインが必要です' }
  }

  if (!(await ensureSessionUserExists(session.user.id))) {
    return { error: SESSION_STALE_ERROR }
  }

  const reviewId = String(formData.get('reviewId') ?? '').trim()
  const movieSlug = String(formData.get('movieSlug') ?? '').trim()
  const langNativeRaw = String(formData.get('langNative') ?? '')
  const langLearnRaw = String(formData.get('langLearn') ?? '')
  const langs = parseReviewLanguagePair(langNativeRaw, langLearnRaw)
  if (!langs.ok) {
    return { error: langs.error }
  }

  const titleJa = String(formData.get('titleJa') ?? '').trim()
  const bodyJa = String(formData.get('bodyJa') ?? '').trim()
  const titleEn = String(formData.get('titleEn') ?? '').trim()
  const bodyEn = String(formData.get('bodyEn') ?? '').trim()

  if (!reviewId || !movieSlug || !titleJa || !bodyJa || !titleEn || !bodyEn) {
    return { error: '必須項目を入力してください' }
  }

  const existing = await prisma.review.findUnique({
    where: { id: reviewId },
    include: {
      movie: { select: { slug: true } },
      user: { select: { email: true } },
    },
  })
  if (!existing) {
    return { error: '感想が見つかりません' }
  }
  if (
    !canModifyReview({
      sessionUserId: session.user.id,
      reviewAuthorId: existing.userId,
      reviewAuthorEmail: existing.user.email,
    })
  ) {
    return { error: 'この感想を編集する権限がありません' }
  }
  if (existing.movie.slug !== movieSlug) {
    return { error: '映画のURLが一致しません' }
  }

  await prisma.review.update({
    where: { id: reviewId },
    data: {
      titleJa,
      bodyJa,
      titleEn,
      bodyEn,
      langNative: langs.native,
      langLearn: langs.learn,
    },
  })

  revalidatePath(`/movies/${movieSlug}`)
  revalidatePath(`/movies/${movieSlug}/review/${reviewId}/edit`)
  revalidatePath('/movies')
  revalidatePath('/movies/everyone')
  revalidatePath('/')
  return { ok: true, movieSlug }
}

export async function deleteReview(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }

  if (!(await ensureSessionUserExists(session.user.id))) {
    redirect('/login')
  }

  const reviewId = String(formData.get('reviewId') ?? '').trim()
  const movieSlug = String(formData.get('movieSlug') ?? '').trim()
  if (!reviewId || !movieSlug) {
    redirect(movieSlug ? movieDetailPath(movieSlug) : '/movies')
  }

  const existing = await prisma.review.findUnique({
    where: { id: reviewId },
    include: {
      movie: { select: { slug: true } },
      user: { select: { email: true } },
    },
  })

  if (!existing || existing.movie.slug !== movieSlug) {
    redirect(movieDetailPath(movieSlug))
  }
  if (
    !canModifyReview({
      sessionUserId: session.user.id,
      reviewAuthorId: existing.userId,
      reviewAuthorEmail: existing.user.email,
    })
  ) {
    redirect(movieDetailPath(movieSlug))
  }

  await prisma.review.delete({ where: { id: reviewId } })

  revalidatePath(`/movies/${movieSlug}`)
  revalidatePath(`/movies/${movieSlug}/review/${reviewId}/edit`)
  revalidatePath('/movies')
  revalidatePath('/movies/everyone')
  revalidatePath('/')
  redirect(movieDetailPath(movieSlug))
}
