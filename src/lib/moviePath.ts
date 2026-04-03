/** 映画まわりのリンク・リダイレクト用（スラッグに非 ASCII が残っている場合も安全に） */
export function movieDetailPath(slug: string): string {
  return `/movies/${encodeURIComponent(slug)}`
}

export function movieWritePath(slug: string): string {
  return `/movies/${encodeURIComponent(slug)}/write`
}

export function movieReviewEditPath(slug: string, reviewId: string): string {
  return `/movies/${encodeURIComponent(slug)}/review/${encodeURIComponent(reviewId)}/edit`
}
