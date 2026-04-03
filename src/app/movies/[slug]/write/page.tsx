import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { ReviewWriteForm } from '@/components/ReviewWriteForm'
import { movieDetailPath, movieWritePath } from '@/lib/moviePath'
import { FREE_TIER_REVIEW_LIMIT, getReviewPostGate } from '@/lib/subscription'

type Props = { params: Promise<{ slug: string }> }

export default async function WriteReviewPage({ params }: Props) {
  const { slug } = await params
  const session = await auth()
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(movieWritePath(slug))}`)
  }

  const movie = await prisma.movie.findUnique({ where: { slug } })
  if (!movie) notFound()

  const gate = await getReviewPostGate(session.user.id, session.user.role)

  return (
    <>
      <h1 className="page-title">感想を投稿</h1>
      {gate.ok ? (
        <>
          <p className="page-lead">
            映画「{movie.title}」について、母国語と学習言語を選び、それぞれのタイトル・本文を入力してください。
          </p>
          <ReviewWriteForm movieSlug={slug} />
        </>
      ) : (
        <div className="paywall-notice" role="status">
          <p className="paywall-notice__title">
            未課金では感想は <strong>{FREE_TIER_REVIEW_LIMIT} 件</strong>までです。すでに上限に達しています。
          </p>
          <p className="paywall-notice__body">
            月額プランに加入すると、件数の制限なく投稿できます。
          </p>
          <Link href="/pricing" className="btn btn--primary paywall-notice__cta">
            料金プランを見る
          </Link>
        </div>
      )}
      <p style={{ marginTop: '1rem' }}>
        <Link href={movieDetailPath(slug)}>映画ページに戻る</Link>
      </p>
    </>
  )
}
