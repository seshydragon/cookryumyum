import { Link, createFileRoute } from '@tanstack/react-router'
import {
  ArrowRight,
  Camera,
  Clock,
  Flame,
  Heart,
  Search,
  Trophy,
  Utensils,
} from 'lucide-react'
import { BadgeIcon } from '../components/BadgeIcon'
import { RecipeCard } from '../components/RecipeCard'
import { activeChallenge, daysLeftInChallenge } from '../data/challenges'
import { BADGES, LEVELS } from '../data/progress'
import {
  CUISINES,
  TIMES_OF_DAY,
  TIME_OF_DAY_LABELS,
  cuisineCounts,
  recipes,
  timeOfDayCounts,
} from '../data/recipes'
import { img } from '../lib/img'
import { getStats } from '../server/kitchen.functions'

export const Route = createFileRoute('/')({
  loader: async () => {
    try {
      const { stats, ratings } = await getStats()
      return { stats, ratings }
    } catch {
      return {
        stats: {
          recipes: recipes.length,
          cooks: 0,
          mealsCooked: 0,
          challengeEntries: 0,
          votes: 0,
          ratings: 0,
        },
        ratings: {} as Record<string, { avg: number; n: number }>,
      }
    }
  },
  component: Home,
})

function Home() {
  const { stats, ratings } = Route.useLoaderData()
  const challenge = activeChallenge()
  const byCuisine = new Map(cuisineCounts())
  const byTime = new Map(timeOfDayCounts())

  const featured = [...recipes]
    .sort((a, b) => {
      const ra = ratings[a.slug]?.n ? ratings[a.slug].avg : a.rating
      const rb = ratings[b.slug]?.n ? ratings[b.slug].avg : b.rating
      return rb - ra
    })
    .slice(0, 6)

  const quick = recipes.filter((r) => r.minutes <= 25).slice(0, 3)

  return (
    <div>
      {/* ---------------------------------------------------------- hero -- */}
      <section className="border-b border-paper-3">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_minmax(0,1fr)] lg:gap-16 lg:py-20">
          <div>
            <p className="eyebrow">Cook and Flame studio</p>
            <h1 className="mt-3 font-display text-5xl leading-[0.97] font-black tracking-tight sm:text-6xl lg:text-7xl">
              Cook what you
              <br />
              already have
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-soft">
              {stats.recipes} photographed, tested recipes you can filter by cuisine and by
              the time of day you are actually going to eat. Log the ones you cook, keep a
              streak, and enter the weekly challenge if you think your plate can take it.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/recipes" className="btn btn-primary">
                <Search size={16} /> Open the shelf
              </Link>
              <Link to="/challenges" className="btn btn-ink">
                <Trophy size={16} /> This week’s challenge
              </Link>
            </div>

            <dl className="mt-10 grid max-w-lg grid-cols-2 gap-x-8 gap-y-5 border-t border-paper-3 pt-7 sm:grid-cols-4">
              <Counter label="Recipes" value={stats.recipes} />
              <Counter label="Cuisines" value={CUISINES.length} />
              <Counter label="Meals logged" value={stats.mealsCooked} />
              <Counter label="Plates entered" value={stats.challengeEntries} />
            </dl>
          </div>

          <div className="relative">
            <img
              src={img('/img/hero-kitchen.jpg', { w: 1200 })}
              alt="A home kitchen counter mid-cook: chopped herbs, a hot pan, and a filled bowl waiting"
              width={1200}
              height={655}
              className="aspect-11/6 w-full object-cover"
            />
            <div className="absolute -bottom-5 -left-5 hidden max-w-[15rem] bg-paper p-4 shadow-[6px_6px_0_var(--color-ember)] sm:block">
              <p className="eyebrow flex items-center gap-1.5 text-ember">
                <Flame size={13} /> Tonight
              </p>
              <p className="mt-1.5 font-display text-base leading-snug font-bold">
                Four ingredients in the fridge is a dinner, not a problem.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- sidebar -- */}
      <section className="border-b border-paper-3 bg-paper-2/60">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="max-w-2xl">
            <p className="eyebrow">Two questions, one shelf</p>
            <h2 className="mt-2 font-display text-3xl leading-tight font-black sm:text-4xl">
              Filter by cuisine and by time of day
            </h2>
            <p className="mt-3 leading-relaxed text-ink-soft">
              Every recipe is tagged with when people actually eat it, so breakfast means
              breakfast and late-night means the thing you cook standing up. Pick several at
              once — and because the filters live in the URL, a filtered shelf is a link you
              can send someone.
            </p>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <div>
              <p className="eyebrow mb-3 flex items-center gap-1.5">
                <Clock size={13} /> Time of day
              </p>
              <ul className="flex flex-wrap gap-2">
                {TIMES_OF_DAY.map((when) => (
                  <li key={when}>
                    <Link to="/recipes" search={{ when: [when] }} className="chip">
                      {TIME_OF_DAY_LABELS[when]}
                      <span className="ml-1.5 text-ink-faint tabular-nums">
                        {byTime.get(when) ?? 0}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="eyebrow mb-3 flex items-center gap-1.5">
                <Utensils size={13} /> Cuisine
              </p>
              <ul className="flex flex-wrap gap-2">
                {CUISINES.map((cuisine) => (
                  <li key={cuisine}>
                    <Link to="/recipes" search={{ cuisine: [cuisine] }} className="chip">
                      {cuisine}
                      <span className="ml-1.5 text-ink-faint tabular-nums">
                        {byCuisine.get(cuisine) ?? 0}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- shelf -- */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Best rated right now</p>
            <h2 className="mt-2 font-display text-3xl font-black sm:text-4xl">
              Off the shelf
            </h2>
          </div>
          <Link
            to="/recipes"
            className="flex items-center gap-1.5 text-sm font-bold text-ember hover:underline"
          >
            All {stats.recipes} recipes <ArrowRight size={15} />
          </Link>
        </div>
        <hr className="rule mt-4 mb-7" />

        <div className="stagger grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((recipe, i) => (
            <RecipeCard
              key={recipe.slug}
              recipe={recipe}
              rating={ratings[recipe.slug]}
              priority={i < 3}
            />
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------- challenge -- */}
      <section className="relative overflow-hidden border-y border-paper-3">
        <img
          src={img('/img/challenge-banner.jpg', { w: 1400, h: 620 })}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/95 via-ink/85 to-ink/45" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_minmax(0,1fr)] lg:gap-16">
            <div>
              <p className="eyebrow text-ember-soft">Weekly cooking challenge</p>
              <h2 className="mt-2 font-display text-4xl leading-[1.02] font-black text-paper sm:text-5xl">
                {challenge.title}
              </h2>
              <p className="mt-4 max-w-lg text-lg leading-relaxed text-paper/85">
                {challenge.prompt}
              </p>
              <p className="mt-5 text-sm text-paper/65">
                Cook it, photograph the plate, and the community votes on the best-looking
                dish. {daysLeftInChallenge()} days left this round; a new prompt opens every
                Monday.
              </p>
              <Link to="/challenges" className="btn btn-primary mt-7">
                <Camera size={16} /> Enter this week
              </Link>
            </div>

            <ul className="flex flex-col gap-5 self-center">
              {[
                {
                  icon: Camera,
                  title: 'One plate each',
                  body: 'Upload a photo of what you actually cooked. Entering is 60 XP before a single vote lands.',
                },
                {
                  icon: Heart,
                  title: 'The community votes',
                  body: 'One vote per plate, never for your own, and every vote your dish collects is 8 XP.',
                },
                {
                  icon: Trophy,
                  title: 'Friendly leaderboards',
                  body: 'Who cooked the most, who hit the most high-protein meals, who ranged widest across cuisines. Three of the four boards reset on Monday.',
                },
              ].map(({ icon: Icon, title, body }) => (
                <li key={title} className="flex gap-4">
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-paper/12 text-ember-soft">
                    <Icon size={18} />
                  </span>
                  <span>
                    <span className="block font-display text-lg font-bold text-paper">
                      {title}
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed text-paper/70">
                      {body}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------- gamified -- */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_1.1fr] lg:gap-16">
          <div>
            <p className="eyebrow">Chef level</p>
            <h2 className="mt-2 font-display text-3xl leading-tight font-black sm:text-4xl">
              Kitchen Novice to Executive Chef
            </h2>
            <p className="mt-4 leading-relaxed text-ink-soft">
              XP comes from things worth doing: cooking at all, cooking a cuisine you have
              never touched, hitting a protein goal, and stringing three nights together.
              Eight ranks, and nothing decays if you take a week off.
            </p>

            <ol className="mt-7 flex flex-col">
              {LEVELS.map((level, i) => (
                <li
                  key={level.name}
                  className="flex items-baseline gap-4 border-b border-paper-3 py-2.5 last:border-0"
                >
                  <span className="w-5 shrink-0 font-display text-sm font-black text-ember tabular-nums">
                    {i + 1}
                  </span>
                  <span className="flex-1">
                    <span className="block text-[0.9375rem] font-bold">{level.name}</span>
                    <span className="block text-sm text-ink-faint">{level.blurb}</span>
                  </span>
                  <span className="shrink-0 text-sm text-ink-soft tabular-nums">
                    {level.minXp} XP
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div>
            <p className="eyebrow">Badges</p>
            <h2 className="mt-2 font-display text-3xl leading-tight font-black sm:text-4xl">
              Twelve of them, and none for signing up
            </h2>
            <p className="mt-4 leading-relaxed text-ink-soft">
              Each badge rewards one specific habit. Pantry Cleared is for cooking a budget
              or five-ingredient recipe rather than going to the shop; Heritage Cook is for
              the slow weekend recipes worth an afternoon.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {BADGES.map((badge) => (
                <div key={badge.slug} className="card flex items-start gap-3 p-4">
                  <span
                    className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-paper"
                    style={{
                      background:
                        badge.tier === 'gold'
                          ? 'var(--color-gold)'
                          : badge.tier === 'silver'
                            ? 'var(--color-olive)'
                            : 'var(--color-ember)',
                    }}
                  >
                    <BadgeIcon icon={badge.icon} size={17} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold">{badge.name}</span>
                    <span className="block text-sm leading-snug text-ink-soft">
                      {badge.how}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- quick -- */}
      <section className="border-t border-paper-3 bg-paper-2/60">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Twenty-five minutes or less</p>
              <h2 className="mt-2 font-display text-3xl font-black sm:text-4xl">
                For the nights you nearly ordered in
              </h2>
            </div>
            <Link
              to="/recipes"
              search={{ max: 30, sort: 'quick' }}
              className="flex items-center gap-1.5 text-sm font-bold text-ember hover:underline"
            >
              Everything under 30 minutes <ArrowRight size={15} />
            </Link>
          </div>
          <hr className="rule mt-4 mb-7" />

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {quick.map((recipe) => (
              <RecipeCard key={recipe.slug} recipe={recipe} rating={ratings[recipe.slug]} />
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- cta -- */}
      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <h2 className="font-display text-3xl leading-tight font-black sm:text-4xl">
          The shelf is free to read. An account is what makes it remember.
        </h2>
        <p className="mx-auto mt-4 max-w-xl leading-relaxed text-ink-soft">
          Browse and cook without signing in. Make an account when you want the XP, the
          streak, the badge case and a name on the board.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/signup" className="btn btn-primary">
            Start a kitchen
          </Link>
          <Link to="/recipes" className="btn btn-ghost">
            Just show me the recipes
          </Link>
        </div>
      </section>
    </div>
  )
}

function Counter({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dd className="font-display text-3xl leading-none font-black tabular-nums">
        {value.toLocaleString()}
      </dd>
      <dt className="mt-1.5 text-sm text-ink-soft">{label}</dt>
    </div>
  )
}
