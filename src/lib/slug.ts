export function slugify(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[''`]/g, '')
    .replace(/[^a-z0-9\u3040-\u30ff\u3400-\u4dbf\w\s-]/gi, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'movie'
}
