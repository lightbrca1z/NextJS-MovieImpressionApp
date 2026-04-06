import nodemailer from 'nodemailer'

type MailArgs = {
  to: string
  from: string
  subject: string
  text: string
  html: string
}

export async function deliverPasswordResetViaSmtp(args: MailArgs): Promise<void> {
  const host = process.env.SMTP_HOST?.trim()
  if (!host) {
    throw new Error('SMTP_HOST が設定されていません')
  }

  const port = parseInt(process.env.SMTP_PORT ?? '587', 10)
  const secure =
    process.env.SMTP_SECURE === 'true' ||
    process.env.SMTP_SECURE === '1' ||
    port === 465

  const user = process.env.SMTP_USER?.trim()
  const pass = process.env.SMTP_PASS?.trim()

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
  })

  await transporter.sendMail({
    from: args.from,
    to: args.to,
    subject: args.subject,
    text: args.text,
    html: args.html,
  })
}

export function defaultSmtpFrom(): string | undefined {
  const explicit = process.env.EMAIL_FROM?.trim()
  if (explicit) return explicit
  const u = process.env.SMTP_USER?.trim()
  if (u?.includes('@')) {
    return `Movie Impression <${u}>`
  }
  return undefined
}
