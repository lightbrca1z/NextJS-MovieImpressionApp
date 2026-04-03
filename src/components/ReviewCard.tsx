import Link from 'next/link'
import type { Review, User } from '@prisma/client'
import { DeleteReviewForm } from '@/components/DeleteReviewForm'
import { canModifyReview } from '@/lib/reviewPermissions'
import {
  getReviewLangLabelJa,
  normalizeReviewLangCode,
  reviewLangToHtmlLang,
} from '@/lib/reviewLanguages'
import { movieReviewEditPath } from '@/lib/moviePath'

type ReviewWithUser = Review & { user: Pick<User, 'id' | 'name' | 'email'> }

export function ReviewCard({
  review,
  movieSlug,
  currentUserId,
}: {
  review: ReviewWithUser
  movieSlug: string
  currentUserId?: string | null
}) {
  const canEdit =
    Boolean(currentUserId) &&
    canModifyReview({
      sessionUserId: currentUserId!,
      reviewAuthorId: review.userId,
      reviewAuthorEmail: review.user.email,
    })

  const nativeCode = normalizeReviewLangCode(review.langNative, 'ja')
  const learnCode = normalizeReviewLangCode(review.langLearn, 'en')
  const nativeLabel = getReviewLangLabelJa(nativeCode)
  const learnLabel = getReviewLangLabelJa(learnCode)

  return (
    <article className="review-card">
      <header className="review-card__meta">
        <span className="review-card__author">{review.user.name}</span>
        <div className="review-card__meta-right">
          <time dateTime={review.createdAt.toISOString()}>
            {review.createdAt.toLocaleDateString('ja-JP')}
          </time>
          {canEdit ? (
            <>
              <Link href={movieReviewEditPath(movieSlug, review.id)} className="review-card__edit">
                編集
              </Link>
              <DeleteReviewForm reviewId={review.id} movieSlug={movieSlug} />
            </>
          ) : null}
        </div>
      </header>

      <div className="review-card__bilingual">
        <section className="review-card__lang" lang={reviewLangToHtmlLang(nativeCode)}>
          <p className="review-card__lang-badge">{nativeLabel}</p>
          <h3 className="review-card__title">{review.titleJa}</h3>
          <div className="review-card__body">
            {review.bodyJa.split('\n').map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>
        <div className="review-card__divider" aria-hidden />
        <section className="review-card__lang" lang={reviewLangToHtmlLang(learnCode)}>
          <p className="review-card__lang-badge">{learnLabel}</p>
          <h3 className="review-card__title">{review.titleEn}</h3>
          <div className="review-card__body">
            {review.bodyEn.split('\n').map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>
      </div>
    </article>
  )
}
