import { useEffect, useMemo, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { CalendarDays, Shuffle, Trash2 } from 'lucide-react'
import { recipes } from '../data/recipes'

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
const KEY = 'cook-flame-meal-plan'

export const Route = createFileRoute('/meal-planner')({ component: MealPlanner })

function MealPlanner() {
  const [plan, setPlan] = useState<Record<string,string[]>>({})
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try { setPlan(JSON.parse(localStorage.getItem(KEY) || '{}')) } catch {}
    setReady(true)
  }, [])

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(plan))
  }, [plan, ready])

  const planned = useMemo(() => Object.values(plan).flat().length, [plan])
  function add(day: string, slug: string) { setPlan(p => ({ ...p, [day]: [...(p[day] || []), slug] })) }
  function remove(day: string, index: number) { setPlan(p => ({ ...p, [day]: (p[day] || []).filter((_, i) => i !== index) })) }
  function fillWeek() {
    const next: Record<string,string[]> = {}
    DAYS.forEach((day, i) => { next[day] = [recipes[i % recipes.length].slug] })
    setPlan(next)
  }
  function clear() { setPlan({}) }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <header className="max-w-3xl">
        <p className="eyebrow flex items-center gap-2"><CalendarDays size={13} /> Meal planner</p>
        <h1 className="mt-2 font-display text-4xl font-black sm:text-5xl">Plan the week without making it a spreadsheet.</h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-soft">Build a seven-day plan from the Cook &amp; Flame shelf. Your plan is saved in this browser.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button className="btn btn-primary" onClick={fillWeek}><Shuffle size={15}/> Fill my week</button>
          <button className="btn btn-ghost" onClick={clear}>Clear</button>
          <span className="self-center text-sm text-ink-faint">{planned} planned meal{planned === 1 ? '' : 's'}</span>
        </div>
      </header>
      <hr className="rule mt-8 mb-8" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {DAYS.map(day => (
          <section key={day} className="card p-4">
            <h2 className="font-display text-xl font-bold">{day}</h2>
            <div className="mt-4 flex flex-col gap-3">
              {(plan[day] || []).map((slug, index) => {
                const recipe = recipes.find(r => r.slug === slug)
                if (!recipe) return null
                return <div key={slug + index} className="border border-paper-3 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <Link to="/recipes/$slug" params={{ slug }} className="text-sm font-bold hover:text-ember">{recipe.title}</Link>
                    <button onClick={() => remove(day, index)} aria-label="Remove meal" className="text-ink-faint hover:text-ember"><Trash2 size={14}/></button>
                  </div>
                  <p className="mt-1 text-xs text-ink-faint">{recipe.minutes} min · {recipe.macros.protein}g protein</p>
                </div>
              })}
              <select className="field text-sm" value="" onChange={e => e.target.value && add(day, e.target.value)}>
                <option value="">+ Add a recipe</option>
                {recipes.map(r => <option key={r.slug} value={r.slug}>{r.title}</option>)}
              </select>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
