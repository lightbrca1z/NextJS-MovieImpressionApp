import type { Session } from 'next-auth'

/** 管理者ログイン用（DB 上のメール）。フォームでは `Manager` と入力 */
export const MANAGER_INTERNAL_EMAIL = 'manager@admin.local'

export function resolveManagerLoginId(raw: string): boolean {
  return raw.trim().toLowerCase() === 'manager'
}

export function isAdminRole(role: string | undefined): boolean {
  return role === 'ADMIN'
}

export function isAdminSession(session: Session | null): boolean {
  return isAdminRole(session?.user?.role)
}

export const ADMIN_ONLY_MOVIES_NEW_MESSAGE =
  '映画の追加と CSV 一括登録は管理者のみ実行できます。'
