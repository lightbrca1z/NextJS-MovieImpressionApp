'use client'

import { REVIEW_LANGUAGE_OPTIONS } from '@/lib/reviewLanguages'

type LangField = 'langNative' | 'langLearn'

/** 母国語ブロック／学習言語ブロックごとに、その記入欄の直前へ置くプルダウン */
export function ReviewLangSelect({
  idPrefix,
  fieldName,
  label,
  value,
  onChange,
}: {
  idPrefix: string
  fieldName: LangField
  label: string
  value: string
  onChange: (code: string) => void
}) {
  const id = `${idPrefix}${fieldName}`
  return (
    <div className="form-group form-group--review-lang-inline">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        name={fieldName}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="form-select"
      >
        {REVIEW_LANGUAGE_OPTIONS.map((o) => (
          <option key={o.code} value={o.code}>
            {o.labelJa}
          </option>
        ))}
      </select>
    </div>
  )
}
