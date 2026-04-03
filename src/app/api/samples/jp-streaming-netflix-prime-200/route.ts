import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { JP_STREAMING_SAMPLE_200_TITLES } from '@/data/jp-streaming-sample-200'
import { isAdminRole } from '@/lib/roles'

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const lines = ['title', ...JP_STREAMING_SAMPLE_200_TITLES.map(escapeCsvCell)]
  const body = `\uFEFF${lines.join('\r\n')}\r\n`

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="jp-movies-anime-netflix-prime-200.csv"',
    },
  })
}
