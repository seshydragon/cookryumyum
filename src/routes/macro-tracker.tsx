import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Camera, Plus, RotateCcw } from 'lucide-react'
import { recipes } from '../data/recipes'

export const Route = createFileRoute('/macro-tracker')({ component: MacroTracker })
type Entry = { id: number; title: string; calories: number; protein: number; carbs: number; fat: number }

function MacroTracker() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [selected, setSelected] = useState(recipes[0].slug)
  const totals = useMemo(() => entries.reduce((a, e) => ({
    calories: a.calories + e.calories, protein: a.protein + e.protein, carbs: a.carbs + e.carbs, fat: a.fat + e.fat,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 }), [entries])

  function addRecipe() {
    const r = recipes.find(x => x.slug === selected)
    if (!r) return
    setEntries(e => [...e, { id: Date.now(), title: r.title, ...r.macros }])
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <header>
        <p className="eyebrow flex items-center gap-2"><Camera size={13}/> Macro tracker</p>
        <h1 className="mt-2 font-display text-4xl font-black sm:text-5xl">See what is on the plate.</h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-soft">Add recipes from the shelf to see their listed nutrition totals. This is a simple recipe-based tracker, not medical nutrition advice.</p>
      </header>
      <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ['Calories', totals.calories, 'kcal'], ['Protein', totals.protein, 'g'], ['Carbs', totals.carbs, 'g'], ['Fat', totals.fat, 'g'],
        ].map(([label, value, unit]) => <div key={String(label)} className="card p-4">
          <p className="eyebrow">{label}</p><p className="mt-2 font-display text-3xl font-black tabular-nums">{value}<span className="ml-1 text-sm font-normal text-ink-faint">{unit}</span></p>
        </div>)}
      </section>
      <section className="card mt-8 p-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <select className="field flex-1" value={selected} onChange={e => setSelected(e.target.value)}>{recipes.map(r => <option key={r.slug} value={r.slug}>{r.title}</option>)}</select>
          <button className="btn btn-primary" onClick={addRecipe}><Plus size={15}/> Add meal</button>
          <button className="btn btn-ghost" onClick={() => setEntries([])}><RotateCcw size={15}/> Reset</button>
        </div>
      </section>
      <section className="mt-8">
        <h2 className="font-display text-2xl font-black">Today</h2><hr className="rule mt-3 mb-5"/>
        {entries.length ? <div className="card divide-y divide-paper-3">{entries.map(e => <div key={e.id} className="flex flex-wrap items-center justify-between gap-3 p-4"><span className="font-semibold">{e.title}</span><span className="text-sm text-ink-soft">{e.calories} kcal · {e.protein}g protein · {e.carbs}g carbs · {e.fat}g fat</span></div>)}</div> : <p className="text-sm text-ink-faint">Nothing logged yet. Pick a recipe above.</p>}
      </section>
    </div>
  )
}
