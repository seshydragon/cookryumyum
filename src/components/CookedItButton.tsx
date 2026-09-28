import { useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { Check, Flame, Star } from 'lucide-react'
import { BadgeIcon } from './BadgeIcon'
import { badgeBySlug } from '../data/progress'
import { cookedIt, rate } from '../server/kitchen.functions'

type Result = {
  awards?: Array<{ label: string; amount: number }>
  newBadges?: Array<string>
  xp?: number
  streak?: number
  level?: string
  error?: string
}

export function CookedItButton({
  recipeSlug,
  signedIn,
  myRating,
}: {
  recipeSlug: string
  signedIn: boolean
  myRating?: number
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [stars, setStars] = useState(myRating ?? 0)

  async function handleCook() {
    setBusy(true)
    try {
      const res = (await cookedIt({ data: { recipeSlug } })) as Result
      setResult(res)
      if (!res.error) await router.invalidate()
    } catch {
      setResult({ error: 'Something went wrong logging that. Try again.' })
    } finally {
      setBusy(false)
    }
  }

  async function handleRate(value: number) {
    setStars(value)
    try {
      await rate({ data: { recipeSlug, stars: value } })
      await router.invalidate()
    } catch {
      /* The star state stays where the cook put it; the next load reconciles. */
    }
  }

  if (!signedIn) {
    return (
      <div className="card p-5">
        <h3 className="font-display text-lg font-bold">Keep score of this one</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
          Logging a cook earns XP, builds your streak and moves you up the brigade from
          Kitchen Novice towards Executive Chef.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/signup" className="btn btn-primary">
            Start a kitchen
          </Link>
          <Link to="/login" className="btn btn-ghost">
            Sign in
          </Link>
        </div>
      </div>
    )
  }

  const earned = result?.awards?.reduce((sum, a) => sum + a.amount, 0) ?? 0

  return (
    <div className="card p-5">
      {result && !result.error ? (
        <div className="pop">
          <p className="eyebrow text-ember">Logged</p>
          <p className="mt-1 font-display text-2xl font-black">+{earned} XP</p>
          <ul className="mt-3 flex flex-col gap-1.5 text-sm">
            {result.awards?.map((award) => (
              <li key={award.label} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-ink-soft">
                  <Check size={13} className="text-olive" /> {award.label}
                </span>
                <span className="font-bold tabular-nums">+{award.amount}</span>
              </li>
            ))}
          </ul>

          {result.newBadges?.length ? (
            <div className="mt-4 border-t border-paper-3 pt-3">
              <p className="eyebrow mb-2">Badge unlocked</p>
              <div className="flex flex-col gap-2">
                {result.newBadges.map((slug) => {
                  const badge = badgeBySlug.get(slug)
                  if (!badge) return null
                  return (
                    <div key={slug} className="flex items-center gap-2.5 text-sm">
                      <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-gold/15 text-gold">
                        <BadgeIcon icon={badge.icon} size={17} />
                      </span>
                      <span className="font-bold">{badge.name}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : null}

          <p className="mt-4 flex items-center gap-1.5 text-xs text-ink-soft">
            <Flame size={13} className="text-ember" />
            {result.streak && result.streak > 1
              ? `${result.streak} days in a row. Do not break it now.`
              : `Now a ${result.level}.`}
          </p>
        </div>
      ) : (
        <>
          <h3 className="font-display text-lg font-bold">Did you cook this?</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
            Logging it earns XP, keeps your streak alive and counts towards badges.
          </p>
          <button
            type="button"
            onClick={handleCook}
            disabled={busy}
            className="btn btn-primary mt-4 w-full"
          >
            {busy ? 'Logging…' : 'I cooked this'}
          </button>
          {result?.error ? (
            <p className="mt-2 text-sm font-semibold text-ember">{result.error}</p>
          ) : null}
        </>
      )}

      <div className="mt-5 border-t border-paper-3 pt-4">
        <p className="eyebrow mb-2">Your rating</p>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => handleRate(value)}
              aria-label={`Rate ${value} out of 5`}
              className="p-0.5 transition-transform hover:scale-115"
            >
              <Star
                size={20}
                className={value <= stars ? 'text-gold' : 'text-paper-3'}
                fill={value <= stars ? 'currentColor' : 'none'}
                strokeWidth={value <= stars ? 0 : 1.5}
              />
            </button>
          ))}
          {stars ? (
            <span className="ml-2 text-xs text-ink-faint">Saved</span>
          ) : null}
        </div>
      </div>
    </div>
  )
}
