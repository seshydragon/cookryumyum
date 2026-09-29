import { Link, createFileRoute } from '@tanstack/react-router'
import { Dumbbell, Flame, Globe2, UtensilsCrossed } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Avatar } from '../components/Avatar'
import { activeChallenge, challengeWindow, daysLeftInChallenge } from '../data/challenges'
import { getBoards } from '../server/kitchen.functions'

export const Route = createFileRoute('/leaderboard')({
  loader: async () => {
    try {
      return { boards: await getBoards() }
    } catch {
      return { boards: null }
    }
  },
  component: Leaderboard,
})

type Row = {
  userId: number
  displayName: string
  avatar: string
}

function Leaderboard() {
  const { boards } = Route.useLoaderData()
  const { start, end } = challengeWindow()
  const week = `${fmt(start)} — ${fmt(new Date(end.getTime() - 86_400_000))}`

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <header className="max-w-2xl">
        <p className="eyebrow">Friendly rivalry</p>
        <h1 className="mt-2 font-display text-4xl leading-[1.05] font-black sm:text-5xl">
          Who actually cooked this week
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-soft">
          Three of these boards reset every Monday, so a good week counts even if you only
          started on Thursday. Chef Level is the long game.
        </p>
        <p className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-faint">
          <span>Week of {week}</span>
          <span>·</span>
          <span>
            {daysLeftInChallenge()} days left of{' '}
            <Link to="/challenges" className="font-semibold text-ember hover:underline">
              {activeChallenge().title}
            </Link>
          </span>
        </p>
      </header>

      <hr className="rule mt-8 mb-10" />

      {!boards || !boards.chefLevel.length ? (
        <div className="card px-6 py-16 text-center">
          <h2 className="font-display text-2xl font-bold">No cooks on the board yet</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-soft">
            Boards fill up as people log what they cooked. Log one recipe and you are top of
            all four of these until someone else turns their oven on.
          </p>
          <Link to="/recipes" search={{ cuisine: [], when: [], tag: [], q: '', sort: 'top', max: undefined }} className="btn btn-primary mt-6">
            Find something to cook
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1.15fr_minmax(0,1fr)]">
          <section className="card p-6">
            <Header
              icon={Flame}
              title="Chef Level"
              hint="All-time XP. Kitchen Novice up to Executive Chef."
            />
            <ol className="mt-5 flex flex-col">
              {boards.chefLevel.map((row, i) => (
                <RowLine
                  key={row.userId}
                  rank={i + 1}
                  row={row}
                  me={row.userId === boards.viewerId}
                  value={`${row.xp.toLocaleString()} XP`}
                  sub={row.level}
                  big
                />
              ))}
            </ol>
          </section>

          <div className="flex flex-col gap-8">
            <section className="card p-6">
              <Header
                icon={UtensilsCrossed}
                title="Most cooked"
                hint="Meals logged since Monday."
              />
              <Board
                rows={boards.mostCooked}
                viewerId={boards.viewerId}
                value={(r) => `${r.cooks}`}
                unit={(r) => (r.cooks === 1 ? 'meal' : 'meals')}
                empty="Nobody has logged a meal this week."
              />
            </section>

            <section className="card p-6">
              <Header
                icon={Dumbbell}
                title="High protein"
                hint="Logged meals at 25g of protein or more."
              />
              <Board
                rows={boards.highProtein}
                viewerId={boards.viewerId}
                value={(r) => `${r.highProtein}`}
                unit={() => 'hits'}
                empty="No high-protein cooks logged yet this week."
              />
            </section>

            <section className="card p-6">
              <Header
                icon={Globe2}
                title="Most diverse"
                hint="Distinct cuisines cooked since Monday."
              />
              <Board
                rows={boards.mostDiverse}
                viewerId={boards.viewerId}
                value={(r) => `${r.cuisines}`}
                unit={(r) => (r.cuisines === 1 ? 'cuisine' : 'cuisines')}
                empty="One cuisine each so far. Go sideways."
              />
            </section>
          </div>
        </div>
      )}

      <section className="mt-16 max-w-3xl">
        <h2 className="font-display text-2xl font-black">How XP is earned</h2>
        <hr className="rule mt-3 mb-5" />
        <dl className="grid gap-x-10 gap-y-3 sm:grid-cols-2">
          {[
            ['Cooking anything you logged', '25 XP'],
            ['A cuisine you have never cooked', '+40 XP'],
            ['A recipe new to you', '+15 XP'],
            ['A meal at 25g protein or more', '+20 XP'],
            ['Keeping a streak alive', '+10 XP a night'],
            ['Entering the weekly challenge', '60 XP'],
            ['Every vote your plate collects', '8 XP'],
            ['Unlocking a badge', '50 XP'],
          ].map(([label, amount]) => (
            <div
              key={label}
              className="flex items-baseline justify-between gap-4 border-b border-paper-3 pb-2"
            >
              <dt className="text-sm text-ink-soft">{label}</dt>
              <dd className="shrink-0 text-sm font-bold tabular-nums text-ember">{amount}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}

function fmt(date: Date) {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function Header({
  icon: Icon,
  title,
  hint,
}: {
  icon: LucideIcon
  title: string
  hint: string
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-ember/12 text-ember">
        <Icon size={18} />
      </span>
      <div>
        <h2 className="font-display text-xl font-black">{title}</h2>
        <p className="text-sm text-ink-faint">{hint}</p>
      </div>
    </div>
  )
}

function Board<T extends Row>({
  rows,
  viewerId,
  value,
  unit,
  empty,
}: {
  rows: Array<T>
  viewerId: number | null
  value: (row: T) => string
  unit: (row: T) => string
  empty: string
}) {
  if (!rows.length) {
    return <p className="mt-5 text-sm leading-relaxed text-ink-faint">{empty}</p>
  }

  return (
    <ol className="mt-5 flex flex-col">
      {rows.map((row, i) => (
        <RowLine
          key={row.userId}
          rank={i + 1}
          row={row}
          me={row.userId === viewerId}
          value={value(row)}
          sub={unit(row)}
        />
      ))}
    </ol>
  )
}

function RowLine({
  rank,
  row,
  me,
  value,
  sub,
  big = false,
}: {
  rank: number
  row: Row
  me: boolean
  value: string
  sub: string
  big?: boolean
}) {
  return (
    <li
      className="flex items-center gap-3 border-b border-paper-3 py-2.5 last:border-0"
      style={me ? { background: 'color-mix(in oklab, var(--color-ember) 7%, transparent)' } : undefined}
    >
      <span
        className="w-6 shrink-0 text-right font-display text-sm font-black tabular-nums"
        style={{ color: rank <= 3 ? 'var(--color-ember)' : 'var(--color-ink-faint)' }}
      >
        {rank}
      </span>
      <Avatar name={row.displayName} swatch={row.avatar} size={big ? 34 : 28} />
      <span className="min-w-0 flex-1">
        <span
          className={`block truncate font-bold ${big ? 'text-[0.9375rem]' : 'text-sm'}`}
        >
          {row.displayName}
          {me ? <span className="ml-2 text-xs font-semibold text-ember">you</span> : null}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className="block text-sm font-black tabular-nums">{value}</span>
        <span className="block text-xs text-ink-faint">{sub}</span>
      </span>
    </li>
  )
}
