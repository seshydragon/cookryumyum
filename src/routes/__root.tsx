import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import { SiteHeader } from '../components/SiteHeader'
import { SiteFooter } from '../components/SiteFooter'
import { getSession } from '../server/kitchen.functions'
import '../styles.css'

const siteName = 'COOKr — cook what you already have'
const siteDescription =
  'A recipe shelf of 24 photographed, tested recipes you can filter by cuisine and time of day, plus weekly cooking challenges, chef levels and badges for the nights you actually cook.'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: siteName },
      { name: 'description', content: siteDescription },
      { property: 'og:title', content: siteName },
      { property: 'og:description', content: siteDescription },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'theme-color', content: '#faf5ec' },
    ],
    links: [{ rel: 'icon', href: '/favicon.ico' }],
  }),
  loader: async () => {
    // The session is read once at the root so the header and every page agree
    // on who is signed in.
    try {
      return await getSession()
    } catch {
      return { user: null, profile: null }
    }
  },
  shellComponent: RootDocument,
  component: RootLayout,
  notFoundComponent: NotFound,
})

function RootLayout() {
  const { user, profile } = Route.useLoaderData()

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-ink focus:px-3 focus:py-2 focus:text-paper"
      >
        Skip to content
      </a>
      <SiteHeader user={user} xp={profile?.xp} level={profile?.level.name} />
      <main id="main">
        <Outlet />
      </main>
      <SiteFooter />
    </>
  )
}

function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
      <p className="eyebrow">404</p>
      <h1 className="mt-2 font-display text-4xl font-black">Nothing on this shelf</h1>
      <p className="mt-3 text-ink-soft">
        That page is not here. The recipes definitely are.
      </p>
      <Link to="/recipes" className="btn btn-primary mt-6">
        Back to the shelf
      </Link>
    </div>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
