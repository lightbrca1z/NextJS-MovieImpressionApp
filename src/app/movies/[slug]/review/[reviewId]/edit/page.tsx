import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { canModifyReview } from '@/lib/reviewPermissions'
import { ReviewEditForm } from '@/components/ReviewEditForm'
import { movieDetailPath, movieReviewEditPath } from '@/lib/moviePath'

type Props = {
  params: Promise<{ slug: string; reviewId: string }>
}

export default async function EditReviewPage({ params }: Props) {
  const { slug, reviewId } = await params
  const session = await auth()
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(movieReviewEditPath(slug, reviewId))}`)
  }

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: {
      movie: { select: { slug: true, title: true } },
      user: { select: { email: true } },
    },
  })

  if (!review || review.movie.slug !== slug) {
    notFound()
  }

  if (
    !canModifyReview({
      sessionUserId: session.user.id,
      reviewAuthorId: review.userId,
      reviewAuthorEmail: review.user.email,
    })
  ) {
    redirect(movieDetailPath(slug))
  }

  return (
    <>
      <h1 className="page-title">感想を編集</h1>
      <p className="page-lead">
        映画「{review.movie.title}」の投稿を更新します。母国語・学習言語の組み合わせも変更できます。
      </p>
      <ReviewEditForm
        movieSlug={slug}
        reviewId={review.id}
        titleJa={review.titleJa}
        bodyJa={review.bodyJa}
        titleEn={review.titleEn}
        bodyEn={review.bodyEn}
        langNative={review.langNative}
        langLearn={review.langLearn}
      />
      <p style={{ marginTop: '1rem' }}>
        <Link href={movieDetailPath(slug)}>映画ページに戻る</Link>
      </p>
    </>
  )
}
