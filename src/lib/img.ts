/**
 * Recipe photos are committed in /public/img and served as static assets.
 * Keep URLs provider-neutral so the app works on Cloudflare Workers instead
 * of depending on Netlify's image transformation endpoint.
 *
 * Width/quality options are retained for existing call sites. Image
 * transformation can be added later with a Cloudflare-native image service.
 */
export function img(
  path: string,
  _opts: { w: number; h?: number; q?: number; fit?: 'cover' | 'contain' } = { w: 800 },
) {
  return path
}

/** Fallback photo URL until a Cloudflare-native blur placeholder is configured. */
export function imgTiny(path: string) {
  return path
}
