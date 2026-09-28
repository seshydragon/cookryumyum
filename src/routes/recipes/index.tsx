import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { SlidersHorizontal, X } from 'lucide-react'
import { RecipeCard } from '../../components/RecipeCard'
import { ShelfSidebar } from '../../components/ShelfSidebar'
import { CUISINES, TIMES_OF_DAY, recipes } from '../../data/recipes'
import type { Cuisine, TimeOfDay } from '../../data/recipes'
import { SORTS, applyFilters, type ShelfFilters, type SortKey } from '../../lib/shelf'
import { getStats } from '../../server/kitchen.functions'

const asArray = (value: unknown): Array<string> => {
  if (Array.isArray(value)) return value.map(String)
  if (typeof value === 'string' && value.length) return value.split(',')
  return []
}

export const Route = createFileRoute('/recipes/')({
  validateSearch: (search: Record<string, unknown>): ShelfFilters => {
    const sort = String(search.sort ?? 'top') as SortKey
    const max = Number(search.max)

    return {
      cuisine: asArray(search.cuisine).filter((c): c is Cuisine =>
        (CUISINES as ReadonlyArray<string>).includes(c),
      ),
      when: asArray(search.when).filter((w): w is TimeOfDay =>
        (TIMES_OF_DAY as ReadonlyArray<string>).includes(w),
      ),
      tag: asArray(search.tag),
      max: Number.isFinite(max) && max > 0 ? max : undefined,
      q: typeof search.q === 'string' ? search.q : '',
      sort: SORTS.some((s) => s.key === sort) ? sort : 'top',
    }
  },
  loaderDeps: () => ({}),
  loader: async () => {
    try {
      const { ratings } = await getStats()
      return { ratings }
    } catch {
      return { ratings: {} as Record<string, { avg: number; n: number }> }
    }
  },
  component: Shelf,
})

function Shelf() {
  const filters = Route.useSearch()
  const { ratings } = Route.useLoaderData()
  const navigate = useNavigate({ from: Route.fullPath })
  const [mobileOpen, setMobileOpen] = useState(false)

  const results = applyFilters(recipes, filters, ratings)

  function onChange(next: Partial<ShelfFilters>) {
    navigate({
      search: (prev) => ({ ...prev, ...next }),
      replace: true,
      resetScroll: false,
    })
  }

  const summary = [
    filters.when.length ? `${filters.when.length} time${filters.when.length > 1 ? 's' : ''} of day` : null,
    filters.cuisine.length ? `${filters.cuisine.length} cuisine${filters.cuisine.length > 1 ? 's' : ''}` : null,
    filters.max ? `under ${filters.max} min` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <header className="mb-8 max-w-3xl">
        <p className="eyebrow">The shelf</p>
        <h1 className="mt-1 font-display text-4xl leading-[1.05] font-black sm:text-5xl">
          {recipes.length} recipes, every one photographed and cooked
        </h1>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-soft">
          Filter by what you feel like and when you are eating it. Breakfast at 8pm is a
          legitimate search.
        </p>
      </header>

      <div className="flex items-center justify-between gap-3 border-y border-paper-3 py-2.5">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="btn btn-ghost py-1.5 text-sm lg:hidden"
        >
          <SlidersHorizontal size={14} /> Filters
          {summary ? <span className="text-ink-faint">· {summary}</span> : null}
        </button>

        <p className="hidden text-sm text-ink-soft lg:block">
          {summary ? <>Showing {summary}</> : <>Showing the whole shelf</>}
        </p>

        <label className="flex items-center gap-2 text-sm">
          <span className="eyebrow">Sort</span>
          <select
            value={filters.sort}
            onChange={(e) => onChange({ sort: e.target.value as SortKey })}
            className="field w-auto py-1.5 pr-7 text-sm font-semibold"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6 flex gap-8">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24 max-h-[calc(100vh-7.5rem)] overflow-y-auto pr-2 pb-4">
            <ShelfSidebar filters={filters} onChange={onChange} resultCount={results.length} />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {results.length ? (
            <div className="stagger grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((recipe, i) => (
                <RecipeCard
                  key={recipe.slug}
                  recipe={recipe}
                  rating={ratings[recipe.slug]}
                  priority={i < 3}
                />
              ))}
            </div>
          ) : (
            <div className="card flex flex-col items-center gap-3 px-6 py-20 text-center">
              <h2 className="font-display text-2xl font-bold">Nothing matches all of that</h2>
              <p className="max-w-sm text-sm text-ink-soft">
                The shelf is 24 recipes deep, not 24,000. Drop a filter or two and something
                will turn up.
              </p>
              <button
                type="button"
                onClick={() =>
                  onChange({ cuisine: [], when: [], tag: [], max: undefined, q: '' })
                }
                className="btn btn-primary mt-1"
              >
                Clear the filters
              </button>
            </div>
          )}
        </div>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            className="flex-1 bg-ink/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="w-[85%] max-w-sm overflow-y-auto border-l border-paper-3 bg-paper p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">Filters</h2>
              <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <ShelfSidebar
              filters={filters}
              onChange={onChange}
              resultCount={results.length}
            />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="btn btn-primary mt-6 w-full"
            >
              Show {results.length} {results.length === 1 ? 'recipe' : 'recipes'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
