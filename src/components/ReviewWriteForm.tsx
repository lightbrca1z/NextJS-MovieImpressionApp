'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createReview, type ReviewActionState } from '@/app/actions/reviews'
import { ReviewLangSelect } from '@/components/ReviewLanguageSelectors'
import { getReviewLangLabelJa } from '@/lib/reviewLanguages'
import { movieDetailPath } from '@/lib/moviePath'

const initial: ReviewActionState = {}

export function ReviewWriteForm({ movieSlug }: { movieSlug: string }) {
  const router = useRouter()
  const [state, action, pending] = useActionState(createReview, initial)
  const [langNative, setLangNative] = useState('ja')
  const [langLearn, setLangLearn] = useState('en')

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
      <input type="hidden" name="movieSlug" value={movieSlug} />
      {state.error ? (
        <div className="alert alert--error" role="alert">
          {state.error}
        </div>
      ) : null}

      <section className="review-write-block" aria-labelledby="write-native-heading">
        <h2 id="write-native-heading" className="review-write-block__title">
          母国語の感想
        </h2>
        <p className="review-write-block__lead">まず母国語でタイトルと本文を書きます。</p>

        <ReviewLangSelect
          idPrefix="write-"
          fieldName="langNative"
          label="このブロックの言語（母国語）"
          value={langNative}
          onChange={setLangNative}
        />

        <p className="lang-badge">入力言語：{nativeLabel}</p>
        <div className="form-group">
          <label htmlFor="titleJa">タイトル（{nativeLabel}）</label>
          <input id="titleJa" name="titleJa" type="text" required placeholder="感想のタイトル" />
        </div>
        <div className="form-group">
          <label htmlFor="bodyJa">本文（{nativeLabel}）</label>
          <textarea id="bodyJa" name="bodyJa" required placeholder="段落ごとに改行できます" />
        </div>
      </section>

      {sameLang ? (
        <p className="form-hint form-hint--warning" role="status">
          母国語と学習言語は別々に選んでください（下のブロックで学習言語を変更できます）。
        </p>
      ) : null}

      <section className="review-write-block review-write-block--learn" aria-labelledby="write-learn-heading">
        <h2 id="write-learn-heading" className="review-write-block__title">
          学習言語の感想
        </h2>
        <p className="review-write-block__lead">続けて学習している言語で、同じ内容を表現します。</p>

        <ReviewLangSelect
          idPrefix="write-"
          fieldName="langLearn"
          label="このブロックの言語（学習言語）"
          value={langLearn}
          onChange={setLangLearn}
        />

        <p className="lang-badge">入力言語：{learnLabel}</p>
        <div className="form-group form-group--en">
          <label htmlFor="titleEn">タイトル（{learnLabel}）</label>
          <input
            id="titleEn"
            name="titleEn"
            type="text"
            required
            placeholder="学習言語でのタイトル"
          />
        </div>
        <div className="form-group form-group--en">
          <label htmlFor="bodyEn">本文（{learnLabel}）</label>
          <textarea
            id="bodyEn"
            name="bodyEn"
            required
            placeholder="学習言語での本文。段落ごとに改行できます。"
          />
        </div>
      </section>

      <div className="actions-row">
        <button type="submit" className="btn btn--primary" disabled={pending || sameLang}>
          {pending ? '投稿中…' : '感想を投稿'}
        </button>
      </div>
    </form>
  )
}
