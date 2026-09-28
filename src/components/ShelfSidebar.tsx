import { Check, RotateCcw, Search } from 'lucide-react'
import {
  TIME_OF_DAY_HINTS,
  TIME_OF_DAY_LABELS,
  cuisineCounts,
  tagCounts,
  timeOfDayCounts,
} from '../data/recipes'
import type { ShelfFilters } from '../lib/shelf'

const TIME_SPANS = [15, 30, 45, 60, 120] as const

function Section({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <section className="border-t border-paper-3 pt-4 first:border-t-0 first:pt-0">
      <h3 className="eyebrow mb-0.5">{title}</h3>
      {hint ? <p className="mb-2 text-xs text-ink-faint">{hint}</p> : <div className="mb-2" />}
      {children}
    </section>
  )
}

function Row({
  label,
  hint,
  count,
  on,
  onToggle,
}: {
  label: string
  hint?: string
  count?: number
  on: boolean
  onToggle: () => void
}) {
  return (
    <button type="button" className="filter-row" data-on={on} onClick={onToggle} aria-pressed={on}>
      <span className="flex min-w-0 items-center gap-2">
        <span
          aria-hidden="true"
          className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px] border"
          style={{
            borderColor: on ? 'var(--color-ember)' : 'var(--color-paper-3)',
            background: on ? 'var(--color-ember)' : 'transparent',
            color: 'var(--color-paper)',
          }}
        >
          {on ? <Check size={11} strokeWidth={3.5} /> : null}
        </span>
        <span className="truncate">
          {label}
          {hint ? (
            <span className="ml-1.5 text-[0.6875rem] font-normal text-ink-faint">{hint}</span>
          ) : null}
        </span>
      </span>
      {count !== undefined ? (
        <span className="shrink-0 text-[0.6875rem] tabular-nums text-ink-faint">{count}</span>
      ) : null}
    </button>
  )
}

/**
 * The shelf sidebar: what cuisine, what time of day, how long you have, and
 * how you eat. Every control writes to the URL, so a filtered shelf is a link
 * you can send someone.
 */
export function ShelfSidebar({
  filters,
  onChange,
  resultCount,
}: {
  filters: ShelfFilters
  onChange: (next: Partial<ShelfFilters>) => void
  resultCount: number
}) {
  const cuisines = cuisineCounts()
  const times = timeOfDayCounts()
  const tags = tagCounts()

  const toggle = <T extends string>(list: Array<T>, value: T): Array<T> =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value]

  const active =
    filters.cuisine.length +
    filters.when.length +
    filters.tag.length +
    (filters.max ? 1 : 0) +
    (filters.q ? 1 : 0)

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="relative block">
          <Search
            size={15}
            className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-ink-faint"
            aria-hidden="true"
          />
          <input
            type="search"
            value={filters.q}
            onChange={(e) => onChange({ q: e.target.value })}
            placeholder="Search the shelf"
            aria-label="Search recipes"
            className="field pl-8"
          />
        </label>
      </div>

      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-ink-soft">
          <strong className="font-display text-base text-ink">{resultCount}</strong>{' '}
          {resultCount === 1 ? 'recipe' : 'recipes'}
        </span>
        {active > 0 ? (
          <button
            type="button"
            onClick={() =>
              onChange({ cuisine: [], when: [], tag: [], max: undefined, q: '' })
            }
            className="flex items-center gap-1 font-semibold text-ember hover:underline"
          >
            <RotateCcw size={12} /> Clear {active}
          </button>
        ) : null}
      </div>

      <Section title="Time of day" hint="When you are actually going to eat it">
        <div className="flex flex-col gap-0.5">
          {times.map(([when, count]) => (
            <Row
              key={when}
              label={TIME_OF_DAY_LABELS[when]}
              hint={TIME_OF_DAY_HINTS[when]}
              count={count}
              on={filters.when.includes(when)}
              onToggle={() => onChange({ when: toggle(filters.when, when) })}
            />
          ))}
        </div>
      </Section>

      <Section title="Cuisine" hint="Pick several to widen the shelf">
        <div className="flex flex-col gap-0.5">
          {cuisines.map(([cuisine, count]) => (
            <Row
              key={cuisine}
              label={cuisine}
              count={count}
              on={filters.cuisine.includes(cuisine)}
              onToggle={() => onChange({ cuisine: toggle(filters.cuisine, cuisine) })}
            />
          ))}
        </div>
      </Section>

      <Section title="Time you have">
        <div className="flex flex-wrap gap-1.5">
          {TIME_SPANS.map((minutes) => {
            const on = filters.max === minutes
            return (
              <button
                key={minutes}
                type="button"
                aria-pressed={on}
                onClick={() => onChange({ max: on ? undefined : minutes })}
                className="rounded-[2px] border px-2.5 py-1 text-xs font-semibold transition-colors"
                style={{
                  borderColor: on ? 'var(--color-ember)' : 'var(--color-paper-3)',
                  background: on ? 'var(--color-ember)' : 'transparent',
                  color: on ? 'var(--color-paper)' : 'var(--color-ink-soft)',
                }}
              >
                ≤ {minutes}m
              </button>
            )
          })}
        </div>
      </Section>

      <Section title="How you eat">
        <div className="flex flex-col gap-0.5">
          {tags.map(([tag, count]) => (
            <Row
              key={tag}
              label={tag.replace(/-/g, ' ')}
              count={count}
              on={filters.tag.includes(tag)}
              onToggle={() => onChange({ tag: toggle(filters.tag, tag) })}
            />
          ))}
        </div>
      </Section>
    </div>
  )
}
