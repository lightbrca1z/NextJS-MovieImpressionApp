/** 映画 CSV 一括取り込みの上限（サーバーと UI で共通） */
export const CSV_MOVIE_IMPORT_MAX = 500

/** 1 行分の CSV をカンマ分割（ダブルクォートで囲まれたカンマは無視） */
export function parseCsvRow(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      result.push(current.trim())
      current = ''
    } else {
      current += c
    }
  }
  result.push(current.trim())
  return result
}

const HEADER_NAMES = new Set(['title', 'タイトル', '映画タイトル', '作品名', 'name'])

function isHeaderRow(firstCell: string): boolean {
  return HEADER_NAMES.has(firstCell.trim().toLowerCase())
}

/**
 * CSV テキストから映画タイトル一覧を取り出す。
 * - BOM 除去
 * - 各行の 1 列目をタイトルとする（2 列目以降は無視）
 * - 先頭行がよくあるヘッダー名だけのときはスキップ
 */
export function extractMovieTitlesFromCsv(text: string): string[] {
  const raw = text.replace(/^\uFEFF/, '')
  const lines = raw.split(/\r?\n/)
  const titles: string[] = []
  let rowIndex = 0
  for (const line of lines) {
    if (!line.trim()) continue
    const cols = parseCsvRow(line)
    const first = (cols[0] ?? '').trim()
    if (!first) continue
    if (rowIndex === 0 && isHeaderRow(first)) {
      rowIndex++
      continue
    }
    rowIndex++
    titles.push(first)
  }
  return titles
}
