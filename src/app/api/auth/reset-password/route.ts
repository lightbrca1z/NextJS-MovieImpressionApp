import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { hashResetToken } from '@/lib/passwordReset'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const token = String(body.token ?? '').trim()
    const password = String(body.password ?? '')

    if (!token) {
      return NextResponse.json({ error: 'リンクが無効です。もう一度お試しください。' }, { status: 400 })
    }
    if (password.length < 4) {
      return NextResponse.json({ error: 'パスワードは4文字以上にしてください' }, { status: 400 })
    }

    const tokenHash = hashResetToken(token)
    const row = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    })

    if (!row || row.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'リンクの有効期限が切れているか、既に使用済みです。最初からやり直してください。' },
        { status: 400 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 10)
    await prisma.$transaction([
      prisma.user.update({
        where: { id: row.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.deleteMany({ where: { userId: row.userId } }),
    ])

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'パスワードの更新に失敗しました' }, { status: 500 })
  }
}
