import { useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { Flame, Menu, X } from 'lucide-react'
import { signOut } from '../server/kitchen.functions'
import { Avatar } from './Avatar'

const NAV = [
  { to: '/recipes', label: 'Recipes' },
  { to: '/challenges', label: 'Challenges' },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/meal-planner', label: 'Meal planner' },
  { to: '/macro-tracker', label: 'Macro tracker' },
  { to: '/dragy', label: 'Dragy' },
  { to: '/kitchen', label: 'My kitchen' },
] as const

export function SiteHeader({
  user,
  xp,
  level,
}: {
  user: { displayName: string; avatar: string } | null
  xp?: number
  level?: string
}) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  async function handleSignOut() {
    await signOut()
    await router.invalidate()
    router.navigate({ to: '/' })
  }

  return (
    <header className="sticky top-0 z-40 border-b border-paper-3 bg-paper/92 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="group flex shrink-0 items-baseline gap-2">
          <span className="font-display text-2xl leading-none font-black tracking-tight">
            COOKr
          </span>
          <span className="hidden text-[0.625rem] font-bold tracking-[0.18em] text-ember uppercase sm:inline">
            Cook &amp; Flame
          </span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-[2px] px-3 py-1.5 text-sm font-semibold text-ink-2 transition-colors hover:bg-paper-2"
              activeProps={{ className: 'bg-paper-2 text-ink' }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              {xp !== undefined ? (
                <span className="hidden items-center gap-1.5 border border-paper-3 px-2.5 py-1 text-xs font-bold text-ink-soft sm:flex">
                  <Flame size={13} className="text-ember" />
                  <span className="tabular-nums">{xp}</span>
                  <span className="hidden font-medium text-ink-faint lg:inline">{level}</span>
                </span>
              ) : null}
              <Link to="/kitchen" className="flex items-center gap-2" title={user.displayName}>
                <Avatar name={user.displayName} swatch={user.avatar} size={32} />
                <span className="hidden text-sm font-semibold lg:inline">
                  {user.displayName}
                </span>
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="hidden text-xs font-semibold text-ink-faint hover:text-ember sm:block"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost hidden py-2 text-sm sm:inline-flex">
                Sign in
              </Link>
              <Link to="/signup" className="btn btn-primary py-2 text-sm">
                Start a kitchen
              </Link>
            </>
          )}

          <button
            type="button"
            className="p-1.5 md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open ? (
        <nav className="border-t border-paper-3 bg-paper px-4 py-2 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="block border-b border-paper-2 py-2.5 text-sm font-semibold last:border-0"
            >
              {item.label}
            </Link>
          ))}
          {user ? (
            <button
              type="button"
              onClick={handleSignOut}
              className="block w-full py-2.5 text-left text-sm font-semibold text-ember"
            >
              Sign out
            </button>
          ) : (
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="block py-2.5 text-sm font-semibold text-ember"
            >
              Sign in
            </Link>
          )}
        </nav>
      ) : null}
    </header>
  )
}
