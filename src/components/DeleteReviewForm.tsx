'use client'

import { deleteReview } from '@/app/actions/reviews'

export function DeleteReviewForm({ reviewId, movieSlug }: { reviewId: string; movieSlug: string }) {
  return (
    <form
      action={deleteReview}
      className="review-card__delete-form"
      onSubmit={(e) => {
        if (!confirm('この感想を削除しますか？取り消せません。')) {
          e.preventDefault()
        }
      }}
    >
      <input type="hidden" name="reviewId" value={reviewId} />
      <input type="hidden" name="movieSlug" value={movieSlug} />
      <button type="submit" className="review-card__delete">
        削除
      </button>
    </form>
  )
}
