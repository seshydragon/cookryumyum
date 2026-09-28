import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, Clock, Flame, Star, Users } from 'lucide-react'
import { CookedItButton } from '../../components/CookedItButton'
import { RecipeCard } from '../../components/RecipeCard'
import {
  TIME_OF_DAY_LABELS,
  getRecipe,
  recipes,
} from '../../data/recipes'
import { img } from '../../lib/img'
import { favoriteRecipe, getFavorites, getSavedRecipe, getSession, getStats } from '../../server/kitchen.functions'

export const Route = createFileRoute('/recipes/$slug')({
  loader: async ({ params }) => {
    const staticRecipe = getRecipe(params.slug)
    const sessionPromise = getSession().catch(() => ({ user: null, profile: null }))
    const recipe = staticRecipe ?? await getSavedRecipe({ data: { slug: params.slug } }).then((saved) => saved ? ({
      slug: saved.slug,
      title: saved.title,
      blurb: saved.description,
      cuisine: saved.cuisine,
      timeOfDay: [saved.category as any],
      minutes: saved.prepTime + saved.cookTime,
      servings: saved.servings,
      difficulty: saved.difficulty,
      rating: 0,
      ratingCount: 0,
      note: 'A recipe from the Cook & Flame community.',
      contributor: 'Community cook',
      image: '/images/recipe-placeholder.jpg',
      imageAlt: saved.title,
      ingredients: saved.ingredients,
      steps: saved.instructions,
      tip: 'Adjust seasoning and cooking time to your ingredients and equipment.',
      tags: [saved.category, saved.cuisine.toLowerCase()],
      macros: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    }) : null)
    if (!recipe) throw notFound()

    const [session, stats] = await Promise.all([
      sessionPromise,
      getStats().catch(() => ({ stats: null, ratings: {} })),
      getFavorites().catch(() => ({ favorites: [] })),
    ])

    return {
      recipe,
      signedIn: Boolean(session.user),
      myRating: session.profile?.ratings?.[params.slug],
      ratings: stats.ratings as Record<string, { avg: number; n: number }>,
      isFavorite: favs.favorites.includes(params.slug),
    }
  },
  component: RecipeDetail,
})

function RecipeDetail() {
  const { recipe, signedIn, myRating, ratings, isFavorite: initialFavorite } = Route.useLoaderData()
  const [isFavorite, setIsFavorite] = useState(initialFavorite)
  const live = ratings[recipe.slug]
  const stars = live?.n ? live.avg : recipe.rating

  const related = recipes
    .filter(
      (r) =>
        r.slug !== recipe.slug &&
        (r.cuisine === recipe.cuisine ||
          r.timeOfDay.some((t) => recipe.timeOfDay.includes(t))),
    )
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3)

  const macros = [
    { label: 'Calories', value: recipe.macros.calories, unit: 'kcal' },
    { label: 'Protein', value: recipe.macros.protein, unit: 'g' },
    { label: 'Carbs', value: recipe.macros.carbs, unit: 'g' },
    { label: 'Fat', value: recipe.macros.fat, unit: 'g' },
  ]

  return (
    <article>
      {/* Asymmetric split: the photo takes the right two thirds and bleeds off. */}
      <div className="border-b border-paper-3 bg-paper-2/50">
        <div className="mx-auto grid max-w-7xl items-stretch gap-0 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_1.15fr]">
          <div className="flex flex-col justify-center py-10 lg:py-16 lg:pr-12">
            <Link
              to="/recipes"
              className="eyebrow mb-5 flex items-center gap-1.5 hover:text-ember"
            >
              <ArrowLeft size={13} /> The shelf
            </Link>

            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="bg-ink px-2 py-1 text-[0.6875rem] font-bold tracking-[0.14em] text-paper uppercase">
                {recipe.cuisine}
              </span>
              {recipe.timeOfDay.map((t) => (
                <span key={t} className="chip">
                  {TIME_OF_DAY_LABELS[t]}
                </span>
              ))}
            </div>

            <h1 className="font-display text-4xl leading-[1.03] font-black sm:text-5xl">
              {recipe.title}
            </h1>

            <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-2">{recipe.blurb}</p>

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink-soft">
              <span className="flex items-center gap-1.5">
                <Clock size={15} /> {recipe.minutes} minutes
              </span>
              <span className="flex items-center gap-1.5">
                <Users size={15} /> Serves {recipe.servings}
              </span>
              <span className="flex items-center gap-1.5">
                <Flame size={15} /> {recipe.difficulty}
              </span>
              <span className="flex items-center gap-1.5 font-bold text-gold">
                <Star size={14} fill="currentColor" strokeWidth={0} />
                {stars.toFixed(1)}
                <span className="font-normal text-ink-faint">
                  ({recipe.ratingCount + (live?.n ?? 0)})
                </span>
              </span>
            </div>

            <p className="mt-6 max-w-xl border-l-2 border-ember pl-4 text-[0.9375rem] leading-relaxed text-ink-soft italic">
              {recipe.note}
            </p>

            <p className="mt-5 text-xs text-ink-faint">
              Written and cooked by {recipe.contributor}
            </p>
          </div>

          <div className="relative min-h-[320px] lg:min-h-[520px]">
            <img
              src={img(recipe.image, { w: 1100, h: 760 })}
              alt={recipe.imageAlt}
              width={1100}
              height={900}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            <div className="grid gap-10 sm:grid-cols-[220px_minmax(0,1fr)]">
              <div>
                <h2 className="eyebrow mb-3">Ingredients</h2>
                <ul className="flex flex-col gap-2 text-[0.9375rem] leading-snug">
                  {recipe.ingredients.map((item) => (
                    <li
                      key={item}
                      className="border-b border-paper-2 pb-2 text-ink-2 last:border-0"
                    >
                      {item}
                    </li>
                  ))}
                </ul>

                <h2 className="eyebrow mt-8 mb-3">Per serving</h2>
                <dl className="grid grid-cols-2 gap-2">
                  {macros.map((m) => (
                    <div key={m.label} className="border border-paper-3 p-2.5">
                      <dt className="text-[0.6875rem] tracking-wide text-ink-faint uppercase">
                        {m.label}
                      </dt>
                      <dd className="font-display text-xl font-bold">
                        {m.value}
                        <span className="ml-0.5 text-xs font-normal text-ink-faint">
                          {m.unit}
                        </span>
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div>
                <h2 className="eyebrow mb-4">Method</h2>
                <ol className="flex flex-col gap-6">
                  {recipe.steps.map((step, i) => (
                    <li key={i} className="flex gap-4">
                      <span className="font-display text-2xl leading-none font-black text-ember/40 tabular-nums">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <p className="flex-1 text-[0.9375rem] leading-relaxed text-ink-2">
                        {step}
                      </p>
                    </li>
                  ))}
                </ol>

                <div className="mt-8 border border-paper-3 bg-paper-2/60 p-4">
                  <p className="eyebrow mb-1.5">If it goes wrong</p>
                  <p className="text-[0.9375rem] leading-relaxed text-ink-2">{recipe.tip}</p>
                </div>

                <div className="mt-6 flex flex-wrap gap-1.5">
                  {recipe.tags.map((tag) => (
                    <Link
                      key={tag}
                      to="/recipes"
                      search={{
                        cuisine: [],
                        when: [],
                        tag: [tag],
                        q: '',
                        sort: 'top' as const,
                        max: undefined,
                      }}
                      className="chip hover:border-ember hover:text-ember"
                    >
                      {tag.replace(/-/g, ' ')}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            {signedIn ? (
              <button
                className="btn btn-ghost w-full"
                onClick={async () => {
                  const result = await favoriteRecipe({ data: { recipeSlug: recipe.slug } })
                  if ('saved' in result && typeof result.saved === 'boolean') setIsFavorite(result.saved)
                }}
              >
                {isFavorite ? '♥ Saved to favorites' : '♡ Save to favorites'}
              </button>
            ) : null}
            <CookedItButton
              recipeSlug={recipe.slug}
              signedIn={signedIn}
              myRating={myRating}
            />

            <div className="card mt-4 p-5">
              <p className="eyebrow mb-2">This week</p>
              <p className="text-sm leading-relaxed text-ink-soft">
                Cook this, photograph it, and enter it into the weekly challenge for 60 XP
                and a shot at the top of the board.
              </p>
              <Link to="/challenges" className="btn btn-ink mt-4 w-full">
                See the challenge
              </Link>
            </div>
          </aside>
        </div>

        {related.length ? (
          <section className="mt-20">
            <h2 className="font-display text-2xl font-black">Cook this next</h2>
            <hr className="rule mt-3 mb-6" />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <RecipeCard key={r.slug} recipe={r} rating={ratings[r.slug]} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </article>
  )
}
