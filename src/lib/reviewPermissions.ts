/** シードのデモ・テストユーザー（prisma/seed.ts と一致させる） */
const SEED_AUTHOR_EMAILS = new Set(['demo@example.com', 'test@test.com'])

export function isSeedAuthorEmail(email: string): boolean {
  return SEED_AUTHOR_EMAILS.has(email.toLowerCase().trim())
}

/**
 * デモ／テストユーザーの感想を、本人以外のログインユーザーが編集・削除できるか。
 * - `next dev`: 既定で true（学習・デモ用）
 * - `next start`（本番相当）: 既定 false。`ALLOW_EDIT_SEED_REVIEWS=true` のときのみ true
 */
export function allowModerateSeedReviews(): boolean {
  if (process.env.ALLOW_EDIT_SEED_REVIEWS === 'true') return true
  if (process.env.NODE_ENV !== 'production') return true
  return false
}

export function canModifyReview(opts: {
  sessionUserId: string
  reviewAuthorId: string
  reviewAuthorEmail: string
}): boolean {
  if (opts.reviewAuthorId === opts.sessionUserId) return true
  if (!allowModerateSeedReviews()) return false
  return isSeedAuthorEmail(opts.reviewAuthorEmail)
}
