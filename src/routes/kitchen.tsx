import { Link, createFileRoute } from '@tanstack/react-router'
import { Flame, Lock } from 'lucide-react'
import { Avatar } from '../components/Avatar'
import { BadgeIcon } from '../components/BadgeIcon'
import { XpBar } from '../components/XpBar'
import { BADGES, LEVELS } from '../data/progress'
import { CUISINES, getRecipe } from '../data/recipes'
import { activeChallenge } from '../data/challenges'
import { img } from '../lib/img'
import { getMyKitchen } from '../server/kitchen.functions'

export const Route = createFileRoute('/kitchen')({
  loader: async () => {
    try {
      return { me: await getMyKitchen() }
    } catch {
      return { me: null }
    }
  },
  component: Kitchen,
})

function Kitchen() {
  const { me } = Route.useLoaderData()

  if (!me) return <SignedOut />

  const { user, profile } = me
  const earned = new Map(profile.badges.map((b) => [b.slug, b.earnedAt] as const))
  const locked = BADGES.filter((b) => !earned.has(b.slug))
  const tried = new Set(profile.cuisinesTried)

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <header className="flex flex-wrap items-center gap-5">
        <Avatar name={user.displayName} swatch={user.avatar} size={64} />
        <div className="min-w-0">
          <p className="eyebrow">Your kitchen</p>
          <h1 className="font-display text-3xl leading-tight font-black sm:text-4xl">
            {user.displayName}
          </h1>
          <p className="mt-1 text-sm text-ink-faint">
            {profile.level.name} · {profile.level.blurb}
          </p>
        </div>
      </header>

      <hr className="rule mt-8 mb-8" />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <section className="card p-6">
            <XpBar
              xp={profile.xp}
              levelIndex={profile.index}
              progress={profile.progress}
              nextName={profile.next?.name}
              xpForNext={profile.xpForNext}
            />

            <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-paper-3 pt-5 sm:grid-cols-4">
              <Stat label="Meals logged" value={profile.totalCooks} />
              <Stat label="Different recipes" value={profile.distinctRecipes} />
              <Stat
                label="Cuisines tried"
                value={`${profile.cuisinesTried.length}/${CUISINES.length}`}
              />
              <Stat label="High-protein cooks" value={profile.highProteinCooks} />
            </div>
          </section>

          <section className="card mt-6 flex flex-wrap items-center gap-x-8 gap-y-4 p-6">
            <div className="flex items-center gap-3">
              <span
                className="flex h-12 w-12 items-center justify-center rounded-sm"
                style={{
                  background:
                    profile.streak > 0
                      ? 'color-mix(in oklab, var(--color-ember) 14%, transparent)'
                      : 'var(--color-paper-2)',
                  color: profile.streak > 0 ? 'var(--color-ember)' : 'var(--color-ink-faint)',
                }}
              >
                <Flame size={22} />
              </span>
              <div>
                <p className="font-display text-3xl leading-none font-black tabular-nums">
                  {profile.streak}
                </p>
                <p className="text-sm text-ink-soft">
                  {profile.streak === 1 ? 'night in a row' : 'nights in a row'}
                </p>
              </div>
            </div>
            <p className="max-w-sm flex-1 text-sm leading-relaxed text-ink-soft">
              {profile.streak === 0
                ? 'Your streak is at zero. Log anything tonight and it starts again — a streak counts a night you cooked, not a night you meant to.'
                : profile.streak < 3
                  ? 'Three nights running unlocks Three in a Row, and every night you keep it is another 10 XP.'
                  : 'Keep going. Every night on the streak is another 10 XP on top of the cook itself.'}
            </p>
          </section>

          <section className="mt-12">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-black">Badge case</h2>
                <p className="mt-1 text-sm text-ink-soft">
                  {earned.size} of {BADGES.length} unlocked.
                </p>
              </div>
            </div>
            <hr className="rule mt-3 mb-6" />

            {earned.size ? (
              <div className="stagger grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {BADGES.filter((b) => earned.has(b.slug)).map((badge) => (
                  <div key={badge.slug} className="card card-lift p-4 text-center">
                    <span
                      className="mx-auto flex h-12 w-12 items-center justify-center rounded-full text-paper"
                      style={{ background: tierColour(badge.tier) }}
                    >
                      <BadgeIcon icon={badge.icon} size={22} />
                    </span>
                    <p className="mt-3 font-display text-base leading-tight font-bold">
                      {badge.name}
                    </p>
                    <p className="mt-1 text-xs text-ink-faint">
                      {new Date(earned.get(badge.slug)!).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-ink-soft">
                Nothing unlocked yet. First Plate lands the moment you log a recipe.
              </p>
            )}

            {locked.length ? (
              <>
                <p className="eyebrow mt-10 mb-4">Still locked</p>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {locked.map((badge) => (
                    <li
                      key={badge.slug}
                      className="flex items-start gap-3 border border-dashed border-paper-3 p-4"
                    >
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-paper-2 text-ink-faint">
                        <Lock size={15} />
                      </span>
                      <span>
                        <span className="block text-sm font-bold">{badge.name}</span>
                        <span className="block text-sm text-ink-soft">{badge.how}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </section>

          <section className="mt-12">
            <h2 className="font-display text-2xl font-black">Recently cooked</h2>
            <hr className="rule mt-3 mb-6" />

            {profile.recent.length ? (
              <ul className="flex flex-col">
                {profile.recent.map((entry, i) => {
                  const recipe = getRecipe(entry.slug)
                  return (
                    <li
                      key={`${entry.slug}-${entry.cookedOn}-${i}`}
                      className="flex items-center gap-4 border-b border-paper-3 py-3 last:border-0"
                    >
                      {recipe ? (
                        <img
                          src={img(recipe.image, { w: 96, h: 96 })}
                          alt={recipe.imageAlt}
                          width={48}
                          height={48}
                          loading="lazy"
                          className="h-12 w-12 shrink-0 object-cover"
                        />
                      ) : null}
                      <span className="min-w-0 flex-1">
                        <Link
                          to="/recipes/$slug"
                          params={{ slug: entry.slug }}
                          className="block truncate text-[0.9375rem] font-bold hover:text-ember"
                        >
                          {entry.title}
                        </Link>
                        <span className="block text-xs text-ink-faint">{entry.cuisine}</span>
                      </span>
                      <span className="shrink-0 text-sm text-ink-soft tabular-nums">
                        {new Date(entry.cookedOn).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="text-sm leading-relaxed text-ink-soft">
                Nothing logged yet. Open a recipe and hit “I cooked this” once the plate is
                empty.
              </p>
            )}
          </section>
        </div>

        <aside className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
          <div className="card p-5">
            <p className="eyebrow mb-3">Cuisines on the map</p>
            <ul className="flex flex-wrap gap-1.5">
              {CUISINES.map((cuisine) => (
                <li key={cuisine}>
                  <Link
                    to="/recipes"
                    search={{ cuisine: [cuisine], when: [], tag: [], q: '', sort: 'top', max: undefined }}
                    className="chip"
                    style={
                      tried.has(cuisine)
                        ? {
                            borderColor: 'var(--color-ember)',
                            color: 'var(--color-ember)',
                            background:
                              'color-mix(in oklab, var(--color-ember) 9%, transparent)',
                          }
                        : undefined
                    }
                  >
                    {cuisine}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs leading-relaxed text-ink-faint">
              Highlighted ones you have cooked. A new cuisine is worth 40 XP, and five of
              them unlock Globe Trotter.
            </p>
          </div>

          <div className="card p-5">
            <p className="eyebrow mb-2">This week</p>
            <p className="font-display text-lg leading-snug font-bold">
              {activeChallenge().title}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              {activeChallenge().prompt}
            </p>
            <Link to="/challenges" className="btn btn-primary mt-4 w-full">
              Enter the challenge
            </Link>
          </div>

          <div className="card p-5">
            <p className="eyebrow mb-3">The brigade</p>
            <ol className="flex flex-col gap-1.5">
              {LEVELS.map((level, i) => (
                <li
                  key={level.name}
                  className="flex items-baseline justify-between gap-3 text-sm"
                  style={{
                    color:
                      i === profile.index
                        ? 'var(--color-ember)'
                        : i < profile.index
                          ? 'var(--color-ink-soft)'
                          : 'var(--color-ink-faint)',
                    fontWeight: i === profile.index ? 700 : 400,
                  }}
                >
                  <span>{level.name}</span>
                  <span className="tabular-nums">{level.minXp}</span>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>
    </div>
  )
}

function tierColour(tier: string) {
  if (tier === 'gold') return 'var(--color-gold)'
  if (tier === 'silver') return 'var(--color-olive)'
  return 'var(--color-ember)'
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <p className="font-display text-2xl leading-none font-black tabular-nums">{value}</p>
      <p className="mt-1 text-sm text-ink-soft">{label}</p>
    </div>
  )
}

function SignedOut() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
      <p className="eyebrow">Your kitchen</p>
      <h1 className="mt-2 font-display text-4xl leading-[1.05] font-black sm:text-5xl">
        Sign in to see what you have cooked
      </h1>
      <p className="mx-auto mt-4 max-w-md text-lg leading-relaxed text-ink-soft">
        Your kitchen holds the XP, the streak, the badge case and the log of every meal you
        have actually made. None of it is public unless you enter a challenge.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/signup" className="btn btn-primary">
          Start a kitchen
        </Link>
        <Link to="/login" className="btn btn-ghost">
          Sign in
        </Link>
      </div>

      <hr className="rule my-12" />

      <div className="grid gap-4 text-left sm:grid-cols-2">
        {BADGES.slice(0, 4).map((badge) => (
          <div key={badge.slug} className="card flex items-start gap-3 p-4">
            <span
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-paper"
              style={{ background: tierColour(badge.tier) }}
            >
              <BadgeIcon icon={badge.icon} size={17} />
            </span>
            <span>
              <span className="block text-sm font-bold">{badge.name}</span>
              <span className="block text-sm text-ink-soft">{badge.how}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
