import { UserRole } from '@prisma/client'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { MANAGER_INTERNAL_EMAIL } from '@/lib/roles'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const email = String(body.email ?? '')
      .toLowerCase()
      .trim()
    const password = String(body.password ?? '')
    const name = String(body.name ?? '').trim()

    if (!email || !password || !name) {
      return NextResponse.json({ error: '必須項目を入力してください' }, { status: 400 })
    }
    if (email === MANAGER_INTERNAL_EMAIL) {
      return NextResponse.json({ error: 'このメールアドレスは使用できません' }, { status: 400 })
    }
    if (password.length < 4) {
      return NextResponse.json({ error: 'パスワードは4文字以上にしてください' }, { status: 400 })
    }

    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) {
      return NextResponse.json({ error: 'このメールアドレスは既に登録されています' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    await prisma.user.create({
      data: { email, passwordHash, name, role: UserRole.USER },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: '登録に失敗しました' }, { status: 500 })
  }
}
