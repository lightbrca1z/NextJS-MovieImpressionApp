import { prisma } from '@/lib/prisma'
import {
  RESET_REQUEST_SUCCESS_MESSAGE,
  buildResetPasswordUrl,
  createPlainResetToken,
  deliverPasswordResetLink,
  hashResetToken,
  resetTokenExpiresAt,
} from '@/lib/passwordReset'

export type PasswordResetRequestResult =
  | { ok: true; message: string }
  | { ok: false; error: string; status: number }

export async function requestPasswordResetForEmail(rawEmail: string): Promise<PasswordResetRequestResult> {
  const email = String(rawEmail ?? '')
    .toLowerCase()
    .trim()

  if (!email || !email.includes('@')) {
    return { ok: false, error: '有効なメールアドレスを入力してください', status: 400 }
  }

  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    return { ok: true, message: RESET_REQUEST_SUCCESS_MESSAGE }
  }

  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } })

  const plain = createPlainResetToken()
  const tokenHash = hashResetToken(plain)
  await prisma.passwordResetToken.create({
    data: {
      tokenHash,
      userId: user.id,
      expiresAt: resetTokenExpiresAt(),
    },
  })

  const resetUrl = buildResetPasswordUrl(plain)

  try {
    const out = await deliverPasswordResetLink({ to: user.email, resetUrl })
    if (!out.sent && !out.devLogged) {
      await prisma.passwordResetToken.delete({ where: { tokenHash } }).catch(() => {})
    }
  } catch (e) {
    await prisma.passwordResetToken.delete({ where: { tokenHash } }).catch(() => {})
    console.error('[password-reset] send failed', e)
    return {
      ok: false,
      error: 'メールの送信に失敗しました。しばらくしてから再度お試しください。',
      status: 502,
    }
  }

  return { ok: true, message: RESET_REQUEST_SUCCESS_MESSAGE }
}
