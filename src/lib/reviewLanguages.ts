/** 感想の母国語・学習言語として選べる言語（コードはフォーム値・DB に保存） */
export const REVIEW_LANGUAGE_OPTIONS = [
  { code: 'ja', labelJa: '日本語' },
  { code: 'en', labelJa: '英語' },
  { code: 'ko', labelJa: '韓国語' },
  { code: 'zh-Hans', labelJa: '中国語（簡体字）' },
  { code: 'zh-Hant', labelJa: '中国語（繁体字）' },
  { code: 'es', labelJa: 'スペイン語' },
  { code: 'fr', labelJa: 'フランス語' },
  { code: 'de', labelJa: 'ドイツ語' },
  { code: 'pt', labelJa: 'ポルトガル語' },
  { code: 'it', labelJa: 'イタリア語' },
  { code: 'vi', labelJa: 'ベトナム語' },
  { code: 'th', labelJa: 'タイ語' },
  { code: 'id', labelJa: 'インドネシア語' },
  { code: 'hi', labelJa: 'ヒンディー語' },
  { code: 'ru', labelJa: 'ロシア語' },
  { code: 'ar', labelJa: 'アラビア語' },
  { code: 'tl', labelJa: 'フィリピノ語（タガログ）' },
  { code: 'ms', labelJa: 'マレー語' },
  { code: 'nl', labelJa: 'オランダ語' },
  { code: 'sv', labelJa: 'スウェーデン語' },
] as const

const ALLOWED = new Set<string>(REVIEW_LANGUAGE_OPTIONS.map((o) => o.code))

export function normalizeReviewLangCode(code: string | null | undefined, fallback: string): string {
  const c = String(code ?? '').trim()
  return ALLOWED.has(c) ? c : fallback
}

export function getReviewLangLabelJa(code: string): string {
  const o = REVIEW_LANGUAGE_OPTIONS.find((x) => x.code === code)
  return o?.labelJa ?? code
}

/** HTML lang 用（簡易マップ） */
export function reviewLangToHtmlLang(code: string): string {
  if (code === 'zh-Hans' || code === 'zh-Hant') return code
  const base = code.split('-')[0]
  return base || 'und'
}

export function parseReviewLanguagePair(
  rawNative: string,
  rawLearn: string
):
  | { ok: true; native: string; learn: string }
  | { ok: false; error: string } {
  const native = rawNative.trim()
  const learn = rawLearn.trim()
  if (!native || !learn) {
    return { ok: false, error: '母国語と学習言語を選んでください' }
  }
  if (!ALLOWED.has(native) || !ALLOWED.has(learn)) {
    return { ok: false, error: '言語の指定が無効です' }
  }
  if (native === learn) {
    return { ok: false, error: '母国語と学習言語は別の言語を選んでください' }
  }
  return { ok: true, native, learn }
}
