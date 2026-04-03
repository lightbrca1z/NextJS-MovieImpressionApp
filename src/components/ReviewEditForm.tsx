'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateReview, type ReviewActionState } from '@/app/actions/reviews'
import { ReviewLangSelect } from '@/components/ReviewLanguageSelectors'
import { getReviewLangLabelJa, normalizeReviewLangCode } from '@/lib/reviewLanguages'
import { movieDetailPath } from '@/lib/moviePath'

const initial: ReviewActionState = {}

type Props = {
  movieSlug: string
  reviewId: string
  titleJa: string
  bodyJa: string
  titleEn: string
  bodyEn: string
  langNative: string
  langLearn: string
}

export function ReviewEditForm({
  movieSlug,
  reviewId,
  titleJa,
  bodyJa,
  titleEn,
  bodyEn,
  langNative: initialNative,
  langLearn: initialLearn,
}: Props) {
  const router = useRouter()
  const [state, action, pending] = useActionState(updateReview, initial)
  const [langNative, setLangNative] = useState(() => normalizeReviewLangCode(initialNative, 'ja'))
  const [langLearn, setLangLearn] = useState(() => normalizeReviewLangCode(initialLearn, 'en'))

  const nativeLabel = getReviewLangLabelJa(langNative)
  const learnLabel = getReviewLangLabelJa(langLearn)
  const sameLang = langNative === langLearn

  useEffect(() => {
    if (state.ok && state.movieSlug) {
      router.push(movieDetailPath(state.movieSlug))
    }
  }, [state.ok, state.movieSlug, router])

  return (
    <form action={action} className="form-panel form-panel--review-write">
      <input type="hidden" name="reviewId" value={reviewId} />
      <input type="hidden" name="movieSlug" value={movieSlug} />
      {state.error ? (
        <div className="alert alert--error" role="alert">
          {state.error}
        </div>
      ) : null}

      <section className="review-write-block" aria-labelledby="edit-native-heading">
        <h2 id="edit-native-heading" className="review-write-block__title">
          母国語の感想
        </h2>
        <p className="review-write-block__lead">母国語のタイトル・本文と、その言語設定です。</p>

        <ReviewLangSelect
          idPrefix="edit-"
          fieldName="langNative"
          label="このブロックの言語（母国語）"
          value={langNative}
          onChange={setLangNative}
        />

        <p className="lang-badge">入力言語：{nativeLabel}</p>
        <div className="form-group">
          <label htmlFor="edit-titleJa">タイトル（{nativeLabel}）</label>
          <input id="edit-titleJa" name="titleJa" type="text" required defaultValue={titleJa} />
        </div>
        <div className="form-group">
          <label htmlFor="edit-bodyJa">本文（{nativeLabel}）</label>
          <textarea id="edit-bodyJa" name="bodyJa" required defaultValue={bodyJa} />
        </div>
      </section>

      {sameLang ? (
        <p className="form-hint form-hint--warning" role="status">
          母国語と学習言語は別々に選んでください。
        </p>
      ) : null}

      <section className="review-write-block review-write-block--learn" aria-labelledby="edit-learn-heading">
        <h2 id="edit-learn-heading" className="review-write-block__title">
          学習言語の感想
        </h2>
        <p className="review-write-block__lead">学習言語のタイトル・本文と、その言語設定です。</p>

        <ReviewLangSelect
          idPrefix="edit-"
          fieldName="langLearn"
          label="このブロックの言語（学習言語）"
          value={langLearn}
          onChange={setLangLearn}
        />

        <p className="lang-badge">入力言語：{learnLabel}</p>
        <div className="form-group form-group--en">
          <label htmlFor="edit-titleEn">タイトル（{learnLabel}）</label>
          <input id="edit-titleEn" name="titleEn" type="text" required defaultValue={titleEn} />
        </div>
        <div className="form-group form-group--en">
          <label htmlFor="edit-bodyEn">本文（{learnLabel}）</label>
          <textarea id="edit-bodyEn" name="bodyEn" required defaultValue={bodyEn} />
        </div>
      </section>

      <div className="actions-row">
        <button type="submit" className="btn btn--primary" disabled={pending || sameLang}>
          {pending ? '保存中…' : '変更を保存'}
        </button>
      </div>
    </form>
  )
}
