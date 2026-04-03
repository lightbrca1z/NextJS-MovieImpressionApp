import type { Metadata } from 'next'
import { auth } from '@/auth'
import { Providers } from '@/components/Providers'
import { AppHeader } from '@/components/AppHeader'
import './globals.css'

export const metadata: Metadata = {
  title: 'Movie Impression — 映画感想（バイリンガル）',
  description: '映画ごとに母国語と学習言語を選んで感想を投稿・閲覧できるアプリ',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await auth()

  return (
    <html lang="ja">
      <body>
        <Providers session={session}>
          <AppHeader session={session} />
          <main className="app-main">{children}</main>
        </Providers>
      </body>
    </html>
  )
}
