import Link from 'next/link'
import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { ReviewCard } from '@/components/ReviewCard'
import { movieWritePath } from '@/lib/moviePath'
import { FREE_TIER_REVIEW_LIMIT, getReviewPostGate } from '@/lib/subscription'

type Props = { params: Promise<{ slug: string }> }

export default async function MovieDetailPage({ params }: Props) {
  const { slug } = await params
  const session = await auth()
  const postGate =
    session?.user?.id != null
      ? await getReviewPostGate(session.user.id, session.user.role)
      : null
  const canPost = postGate?.ok ?? false

  const movie = await prisma.movie.findUnique({
    where: { slug },
    include: {
      reviews: {
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  })

  if (!movie) notFound()

  return (
    <>
      <h1 className="page-title">{movie.title}</h1>
      <p className="page-lead">
        各感想は投稿者が選んだ母国語（左）と学習言語（右）のバイリンガル表示です。あなたが投稿した映画だけ見たいときは、ヘッダーの「自分の感想」から映画一覧を開いてください。
      </p>

      <div className="actions-row" style={{ marginBottom: '1.5rem' }}>
        {session?.user ? (
          canPost ? (
            <Link href={movieWritePath(slug)} className="btn btn--primary" style={{ textDecoration: 'none' }}>
              感想を投稿(母国語と学習言語)
            </Link>
          ) : (
            <Link href="/pricing" className="btn btn--primary" style={{ textDecoration: 'none' }}>
              未課金の上限（{FREE_TIER_REVIEW_LIMIT} 件）に達しました · プランを見る
            </Link>
          )
        ) : (
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(movieWritePath(slug))}`}
            className="btn btn--primary"
            style={{ textDecoration: 'none' }}
          >
            ログインして投稿
          </Link>
        )}
        <Link href="/movies">一覧へ戻る</Link>
      </div>

      {movie.reviews.length === 0 ? (
        <p className="page-lead">まだ感想がありません。最初の投稿をしてみましょう。</p>
      ) : (
        movie.reviews.map((r) => (
          <ReviewCard key={r.id} review={r} movieSlug={slug} currentUserId={session?.user?.id} />
        ))
      )}
    </>
  )
}
