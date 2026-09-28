import { createFileRoute } from '@tanstack/react-router'
import { readChallengePhoto } from '../../server/kitchen.server'

/**
 * Challenge photos live in a Netlify Blobs store rather than the public folder,
 * so they need an endpoint. The blob key is the splat, and the response is
 * immutable because a replaced entry gets a brand new key.
 */
export const Route = createFileRoute('/api/challenge-photo/$')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const key = decodeURIComponent((params as { _splat?: string })._splat ?? '')
        if (!key) return new Response('Missing key', { status: 400 })

        try {
          const photo = await readChallengePhoto(key)
          if (!photo) return new Response('Not found', { status: 404 })

          return new Response(photo.body, {
            headers: {
              'Content-Type': photo.contentType,
              'Cache-Control': 'public, max-age=31536000, immutable',
            },
          })
        } catch {
          return new Response('Not found', { status: 404 })
        }
      },
    },
  },
})
