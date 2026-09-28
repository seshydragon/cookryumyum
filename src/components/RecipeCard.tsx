import { Link } from '@tanstack/react-router'
import { Clock, Star } from 'lucide-react'
import type { Recipe } from '../data/recipes'
import { TIME_OF_DAY_LABELS } from '../data/recipes'
import { img } from '../lib/img'

export function RecipeCard({
  recipe,
  rating,
  priority = false,
}: {
  recipe: Recipe
  rating?: { avg: number; n: number }
  priority?: boolean
}) {
  const stars = rating?.n ? rating.avg : recipe.rating
  const count = (rating?.n ?? 0) + recipe.ratingCount

  return (
    <Link
      to="/recipes/$slug"
      params={{ slug: recipe.slug }}
      className="card card-lift group flex flex-col overflow-hidden"
    >
      <div className="relative aspect-4/3 overflow-hidden bg-paper-2">
        <img
          src={img(recipe.image, { w: 640, h: 480 })}
          alt={recipe.imageAlt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          width={640}
          height={480}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <span className="absolute top-0 left-0 bg-ink/85 px-2 py-1 text-[0.6875rem] font-bold tracking-[0.14em] text-paper uppercase">
          {recipe.cuisine}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-[1.0625rem] leading-snug font-semibold">{recipe.title}</h3>
          <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-gold">
            <Star size={12} fill="currentColor" strokeWidth={0} />
            {stars.toFixed(1)}
          </span>
        </div>

        <p className="flex-1 text-[0.8125rem] leading-relaxed text-ink-soft">
          {recipe.blurb}
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.75rem] text-ink-faint">
          <span className="flex items-center gap-1">
            <Clock size={12} /> {recipe.minutes} min
          </span>
          <span>{recipe.macros.protein}g protein</span>
          <span className="text-ink-soft">
            {recipe.timeOfDay.map((t) => TIME_OF_DAY_LABELS[t]).join(' · ')}
          </span>
          <span className="ml-auto">{count} ratings</span>
        </div>
      </div>
    </Link>
  )
}
