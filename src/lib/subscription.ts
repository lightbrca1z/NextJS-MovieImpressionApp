import { prisma } from '@/lib/prisma'

/** ローカル検証用: true なら課金チェックをスキップ（本番では使わない） */
function paidGatingDisabled(): boolean {
  return process.env.DISABLE_PAID_GATING === 'true'
}

/** アクティブなサブスクがあるか（機能制御用） */
export async function getActiveSubscription(userId: string) {
  return prisma.subscription.findFirst({
    where: {
      userId,
      status: { in: ['active', 'trialing'] },
    },
    orderBy: { updatedAt: 'desc' },
  })
}

export async function hasActivePaidPlan(userId: string): Promise<boolean> {
  if (paidGatingDisabled()) return true
  const s = await getActiveSubscription(userId)
  return Boolean(s)
}

/** 未課金の一般ユーザーが投稿できる感想の上限（管理者・課金ユーザーは無制限） */
export const FREE_TIER_REVIEW_LIMIT = 200

export async function countReviewsByUser(userId: string): Promise<number> {
  return prisma.review.count({ where: { userId } })
}

export type ReviewPostGate = { ok: true } | { ok: false; reason: 'free_tier_limit' }

/**
 * 感想の新規投稿が可能か。管理者は課金なし、一般は課金 or 200 件未満。
 */
export async function getReviewPostGate(
  userId: string,
  role: 'USER' | 'ADMIN' | undefined
): Promise<ReviewPostGate> {
  if (paidGatingDisabled()) return { ok: true }
  if (role === 'ADMIN') return { ok: true }
  if (await hasActivePaidPlan(userId)) return { ok: true }
  const n = await countReviewsByUser(userId)
  if (n < FREE_TIER_REVIEW_LIMIT) return { ok: true }
  return { ok: false, reason: 'free_tier_limit' }
}

export const PAID_PLAN_REQUIRED_MESSAGE =
  '月額プランへのご加入が必要です。/pricing から Checkout を完了し、Webhook 反映後（数秒〜）にご利用いただけます。'

export async function ensurePaidContentAccess(
  userId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (paidGatingDisabled()) return { ok: true }
  if (await hasActivePaidPlan(userId)) return { ok: true }
  return { ok: false, error: PAID_PLAN_REQUIRED_MESSAGE }
}
