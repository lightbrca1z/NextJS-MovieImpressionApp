'use client'

import { useActionState, useState } from 'react'
import { importMoviesFromCsv, type CsvMovieImportState } from '@/app/actions/movies'
import { CSV_MOVIE_IMPORT_MAX } from '@/lib/csvMovieTitles'

const initial: CsvMovieImportState = {}

const CSV_TEMPLATE = `title
Night at the Museum
千と千尋の神隠し
"Inception, 2010"`

export function MovieCsvImportForm() {
  const [state, action, pending] = useActionState(importMoviesFromCsv, initial)
  const [copied, setCopied] = useState(false)

  async function copyTemplate() {
    try {
      await navigator.clipboard.writeText(CSV_TEMPLATE)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <form action={action} className="form-panel">
      {state.error ? (
        <div className="alert alert--error" role="alert">
          {state.error}
        </div>
      ) : null}
      {state.added != null && state.added > 0 ? (
        <div className="alert alert--success" role="status">
          <strong>{state.added}</strong> 件の映画を追加しました。
          {state.skippedDuplicateInFile ? (
            <>
              {' '}
              ファイル内の重複 <strong>{state.skippedDuplicateInFile}</strong> 行はスキップしました。
            </>
          ) : null}
        </div>
      ) : null}

      <div className="csv-sample" aria-labelledby="csv-sample-label">
        <div className="csv-sample__head">
          <span id="csv-sample-label">CSV の雛形</span>
          <div className="csv-sample__actions">
            <button
              type="button"
              className="btn btn--ghost"
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
              onClick={copyTemplate}
            >
              {copied ? 'コピーしました' : '雛形をコピー'}
            </button>
            <a
              href="/api/samples/jp-streaming-netflix-prime-200"
              className="btn btn--ghost"
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', textDecoration: 'none' }}
              download
            >
              サンプル200本をダウンロード
            </a>
          </div>
        </div>
        <p className="csv-sample__note">
          サンプルは Netflix / Prime Video などで配信されやすい<strong>日本の映画・アニメ</strong>の例です（アプリの DB
          とは別リスト）。配信は作品・地域・時期で変わります。
        </p>
        <pre className="csv-sample__pre">{CSV_TEMPLATE}</pre>
      </div>

      <div className="form-group">
        <label htmlFor="movie-csv">CSV ファイル</label>
        <input id="movie-csv" name="csv" type="file" accept=".csv,text/csv" required disabled={pending} />
        <p className="form-hint">
          UTF-8 の CSV。各行の <strong>1 列目</strong>を映画タイトルとして登録します（2 列目以降は無視）。先頭行に{' '}
          <code>title</code> や <code>タイトル</code> などのヘッダーを付けても構いません。タイトルが重複する行は 1
          件だけ取り込みます。最大 {CSV_MOVIE_IMPORT_MAX} 件・2MB まで。
        </p>
      </div>
      <div className="actions-row">
        <button type="submit" className="btn btn--primary" disabled={pending}>
          {pending ? '取り込み中…' : 'CSV から一括登録'}
        </button>
      </div>
    </form>
  )
}
