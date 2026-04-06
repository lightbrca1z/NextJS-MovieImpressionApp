import crypto from 'crypto'

const TOKEN_BYTES = 32
const RESET_TTL_MS = 60 * 60 * 1000

export function hashResetToken(plain: string): string {
  return crypto.createHash('sha256').update(plain, 'utf8').digest('hex')
}

export function createPlainResetToken(): string {
  return crypto.randomBytes(TOKEN_BYTES).toString('base64url')
}

export function resetTokenExpiresAt(): Date {
  return new Date(Date.now() + RESET_TTL_MS)
}

function trimTrailingSlash(s: string): string {
  return s.replace(/\/$/, '')
}

/** パスワード再設定リンクのオリジン。Vercel では VERCEL_URL が自動で入るので localhost にならないようにする。 */
export function appOrigin(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL?.trim(),
    process.env.AUTH_URL?.trim(),
    process.env.NEXTAUTH_URL?.trim(),
  ].filter(Boolean) as string[]

  for (let raw of candidates) {
    raw = trimTrailingSlash(raw)
    if (!raw) continue
    if (!/^https?:\/\//i.test(raw)) {
      raw = `https://${raw}`
    }
    return trimTrailingSlash(raw)
  }

  const vercel = process.env.VERCEL_URL?.trim()
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//i, '')
    return trimTrailingSlash(`https://${host}`)
  }

  return 'http://localhost:3000'
}

export function buildResetPasswordUrl(plainToken: string): string {
  const base = appOrigin()
  const q = new URLSearchParams({ token: plainToken })
  return `${base}/reset-password?${q.toString()}`
}

type SendResetEmailArgs = { to: string; resetUrl: string }

function shouldLogResetLinkToConsole(): boolean {
  if (process.env.NODE_ENV === 'development') return true
  if (process.env.PASSWORD_RESET_LOG_URL === '1' || process.env.PASSWORD_RESET_LOG_URL === 'true') return true
  const o = appOrigin()
  return /localhost|127\.0\.0\.1/i.test(o)
}

function resetMailContent(resetUrl: string): { subject: string; html: string; text: string } {
  const subject = 'Movie Impression — パスワード再設定'
  const html = `<p>以下のリンクからパスワードを再設定できます（1時間有効）。</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>心当たりがない場合はこのメールを無視してください。</p>`
  const text = `以下のリンクからパスワードを再設定できます（1時間有効）。\n\n${resetUrl}\n\n心当たりがない場合はこのメールを無視してください。`
  return { subject, html, text }
}

async function sendViaResend(args: SendResetEmailArgs, content: ReturnType<typeof resetMailContent>): Promise<void> {
  const key = process.env.RESEND_API_KEY!.trim()

  const from =
    process.env.EMAIL_FROM?.trim() || 'Movie Impression <onboarding@resend.dev>'

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [args.to],
      subject: content.subject,
      html: content.html,
      text: content.text,
    }),
  })
  if (!res.ok) {
    const raw = await res.text()
    let detail = raw
    try {
      const j = JSON.parse(raw) as { message?: string | string[] }
      if (j?.message != null) {
        detail = Array.isArray(j.message) ? j.message.join(', ') : String(j.message)
      }
    } catch {
      /* keep raw */
    }
    throw new Error(`Resend (${res.status}): ${detail}`)
  }
}

/**
 * 優先順: Resend → SMTP（Gmail 等）→ コンソール（フォールバック）。
 * 以前は開発モードでコンソールが先に選ばれ、SMTP が無視されていた。
 */
export async function deliverPasswordResetLink(args: SendResetEmailArgs): Promise<{ sent: boolean; devLogged: boolean }> {
  const content = resetMailContent(args.resetUrl)

  if (process.env.RESEND_API_KEY?.trim()) {
    await sendViaResend(args, content)
    return { sent: true, devLogged: false }
  }

  if (process.env.SMTP_HOST?.trim()) {
    const { deliverPasswordResetViaSmtp, defaultSmtpFrom } = await import('@/lib/passwordResetSmtp')
    const from = defaultSmtpFrom()
    if (!from) {
      throw new Error('SMTP 利用時は EMAIL_FROM または SMTP_USER（メール形式）を設定してください')
    }
    await deliverPasswordResetViaSmtp({
      to: args.to,
      from,
      subject: content.subject,
      text: content.text,
      html: content.html,
    })
    return { sent: true, devLogged: false }
  }

  if (shouldLogResetLinkToConsole()) {
    console.log('\n[password-reset] Resend/SMTP 未設定のため、コンソールに再設定リンクを表示:\n', args.resetUrl, '\n')
    return { sent: false, devLogged: true }
  }

  console.warn('[password-reset] メール送信が未設定です。ユーザー:', args.to)
  return { sent: false, devLogged: false }
}

export const RESET_REQUEST_SUCCESS_MESSAGE =
  '登録済みの場合、そのメールアドレス宛にパスワード再設定用の案内を送信しました。メールが届かない場合は迷惑メールフォルダもご確認ください。'
