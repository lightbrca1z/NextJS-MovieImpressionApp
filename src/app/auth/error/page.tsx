import Link from 'next/link'

export const metadata = {
  title: '認証エラー — Movie Impression',
}

type Props = { searchParams: Promise<{ error?: string }> }

const MESSAGES: Record<string, { title: string; body: string }> = {
  Configuration: {
    title: 'サーバー設定（AUTH_SECRET）',
    body:
      '本番・Preview では環境変数 AUTH_SECRET（または NEXTAUTH_SECRET）が必須です。Vercel の Project Settings → Environment Variables で、Production と Preview の両方に設定してください。値は `openssl rand -base64 32` などで生成できます。.env.example も参照してください。',
  },
  AccessDenied: {
    title: 'アクセスが拒否されました',
    body: 'サインイン条件を満たしていないか、権限がありません。',
  },
  Verification: {
    title: '確認リンクの問題',
    body: 'リンクの有効期限が切れているか、既に使用済みです。',
  },
}

export default async function AuthErrorPage({ searchParams }: Props) {
  const { error: code } = await searchParams
  const key = code && MESSAGES[code] ? code : 'Default'
  const msg =
    key === 'Default'
      ? {
          title: '認証エラー',
          body: 'ログイン処理中に問題が発生しました。時間をおいて再度お試しください。',
        }
      : MESSAGES[key as keyof typeof MESSAGES]

  return (
    <>
      <h1 className="page-title">{msg.title}</h1>
      <p className="page-lead" style={{ whiteSpace: 'pre-wrap' }}>
        {msg.body}
      </p>
      <p className="page-lead">
        <Link href="/login">ログインへ戻る</Link>
        {' · '}
        <Link href="/">トップへ</Link>
      </p>
    </>
  )
}
