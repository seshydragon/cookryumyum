import type { Cuisine, Recipe, TimeOfDay } from '../data/recipes'

export type SortKey = 'top' | 'quick' | 'protein' | 'light'

export type ShelfFilters = {
  cuisine: Array<Cuisine>
  when: Array<TimeOfDay>
  tag: Array<string>
  max?: number
  q: string
  sort: SortKey
}

export const EMPTY_FILTERS: ShelfFilters = {
  cuisine: [],
  when: [],
  tag: [],
  max: undefined,
  q: '',
  sort: 'top',
}

export const SORTS: Array<{ key: SortKey; label: string }> = [
  { key: 'top', label: 'Best rated' },
  { key: 'quick', label: 'Quickest' },
  { key: 'protein', label: 'Most protein' },
  { key: 'light', label: 'Lightest' },
]

export function applyFilters(
  recipes: Array<Recipe>,
  filters: ShelfFilters,
  ratings: Record<string, { avg: number; n: number }> = {},
) {
  const query = filters.q.trim().toLowerCase()

  const matched = recipes.filter((recipe) => {
    if (filters.cuisine.length && !filters.cuisine.includes(recipe.cuisine)) return false
    if (filters.when.length && !recipe.timeOfDay.some((t) => filters.when.includes(t)))
      return false
    if (filters.tag.length && !filters.tag.every((t) => recipe.tags.includes(t))) return false
    if (filters.max && recipe.minutes > filters.max) return false

    if (query) {
      const haystack = [
        recipe.title,
        recipe.cuisine,
        recipe.blurb,
        recipe.tags.join(' '),
        recipe.ingredients.join(' '),
      ]
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(query)) return false
    }

    return true
  })

  const score = (r: Recipe) => {
    const live = ratings[r.slug]
    return live?.n ? (live.avg * live.n + r.rating * r.ratingCount) / (live.n + r.ratingCount) : r.rating
  }

  return [...matched].sort((a, b) => {
    switch (filters.sort) {
      case 'quick':
        return a.minutes - b.minutes || score(b) - score(a)
      case 'protein':
        return b.macros.protein - a.macros.protein || score(b) - score(a)
      case 'light':
        return a.macros.calories - b.macros.calories || score(b) - score(a)
      default:
        return score(b) - score(a) || b.ratingCount - a.ratingCount
    }
  })
}
