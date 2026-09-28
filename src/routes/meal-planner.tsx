import { useEffect, useMemo, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { CalendarDays, Shuffle, Trash2 } from 'lucide-react'
import { addToMealPlan, clearMyMealPlan, getMyMealPlan, getSession, removeFromMealPlan } from '../server/kitchen.functions'
import { recipes } from '../data/recipes'

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

export const Route = createFileRoute('/meal-planner')({ component: MealPlanner })

type Item = { id: number; recipeSlug: string; position: number }
type Plan = Record<string, Item[]>

function MealPlanner() {
  const [plan, setPlan] = useState<Plan>({})
  const [signedIn, setSignedIn] = useState(false)
  const [loading, setLoading] = useState(true)

  async function load() {
    const [session, result] = await Promise.all([getSession(), getMyMealPlan()])
    setSignedIn(Boolean(session.user))
    if (result.plan) setPlan(result.plan as Plan)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const planned = useMemo(() => Object.values(plan).flat().length, [plan])

  async function add(day: string, slug: string) {
    const result = await addToMealPlan({ data: { day, recipeSlug: slug } })
    if ('error' in result && result.error) return
    await load()
  }

  async function remove(id: number) {
    await removeFromMealPlan({ data: { id } })
    await load()
  }

  async function fillWeek() {
    for (let i = 0; i < DAYS.length; i++) await addToMealPlan({ data: { day: DAYS[i], recipeSlug: recipes[i % recipes.length].slug } })
    await load()
  }

  async function clear() {
    await clearMyMealPlan()
    await load()
  }

  if (loading) return <main className="mx-auto max-w-7xl px-4 py-12"><p className="text-ink-soft">Loading your plan…</p></main>

  if (!signedIn) return <main className="mx-auto max-w-3xl px-4 py-12"><p className="eyebrow">Meal planner</p><h1 className="mt-2 font-display text-4xl font-black">Your week, saved to your account.</h1><p className="mt-4 text-ink-soft">Sign in to build a meal plan that follows you between devices.</p><Link className="btn btn-primary mt-6 inline-flex" to="/login">Sign in</Link></main>

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <header className="max-w-3xl">
        <p className="eyebrow flex items-center gap-2"><CalendarDays size={13} /> Meal planner</p>
        <h1 className="mt-2 font-display text-4xl font-black sm:text-5xl">Plan the week without making it a spreadsheet.</h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-soft">Your plan is stored in Cook &amp; Flame, so it isn't trapped in one browser.</p>
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
              {(plan[day] || []).map(item => {
                const recipe = recipes.find(r => r.slug === item.recipeSlug)
                if (!recipe) return <div key={item.id} className="border border-paper-3 p-3 text-sm text-ink-soft">Saved recipe: {item.recipeSlug}</div>
                return <div key={item.id} className="border border-paper-3 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <Link to="/recipes/$slug" params={{ slug: recipe.slug }} className="text-sm font-bold hover:text-ember">{recipe.title}</Link>
                    <button onClick={() => remove(item.id)} aria-label="Remove meal" className="text-ink-faint hover:text-ember"><Trash2 size={14}/></button>
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
