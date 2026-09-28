/**
 * Every photo goes through the Netlify Image CDN rather than being served at
 * full model resolution. Originals live in /public/img and are never linked
 * directly from a page.
 */
export function img(
  path: string,
  opts: { w: number; h?: number; q?: number; fit?: 'cover' | 'contain' } = { w: 800 },
) {
  const params = new URLSearchParams({ url: path, w: String(opts.w), fm: 'webp' })
  if (opts.h) params.set('h', String(opts.h))
  if (opts.h && (opts.fit ?? 'cover') === 'cover') params.set('fit', 'cover')
  else if (opts.fit) params.set('fit', opts.fit)
  params.set('q', String(opts.q ?? 72))
  return `/.netlify/images?${params.toString()}`
}

/** A tiny blurred stand-in used as a CSS background while the photo loads. */
export function imgTiny(path: string) {
  return img(path, { w: 24, q: 40 })
}
