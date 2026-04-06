import { NextResponse } from 'next/server'
import { requestPasswordResetForEmail } from '@/lib/passwordResetRequest'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const email = String(body.email ?? '')
    const result = await requestPasswordResetForEmail(email)

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    return NextResponse.json(
      { ok: true, message: result.message },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
        },
      }
    )
  } catch {
    return NextResponse.json({ error: '処理に失敗しました' }, { status: 500 })
  }
}
