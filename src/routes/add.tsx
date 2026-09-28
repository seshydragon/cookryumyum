import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Plus, Trash2 } from 'lucide-react'
import { createRecipe } from '../server/kitchen.functions'

export const Route = createFileRoute('/add')({ component: AddRecipe })

const emptyIngredient = () => ({ amount: '', item: '' })

function AddRecipe() {
  const navigate = useNavigate()
  const [ingredients, setIngredients] = useState([emptyIngredient()])
  const [instructions, setInstructions] = useState([''])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    const form = new FormData(event.currentTarget)
    const result = await createRecipe({
      data: {
        title: String(form.get('title') || ''),
        description: String(form.get('description') || ''),
        category: String(form.get('category') || 'dinner'),
        cuisine: String(form.get('cuisine') || 'Other'),
        difficulty: String(form.get('difficulty') || 'easy'),
        servings: Number(form.get('servings') || 2),
        prepTime: Number(form.get('prepTime') || 0),
        cookTime: Number(form.get('cookTime') || 0),
        ingredients: ingredients.map(x => [x.amount.trim(), x.item.trim()].filter(Boolean).join(' ')).filter(Boolean),
        instructions: instructions.map(x => x.trim()).filter(Boolean),
      },
    })
    setSaving(false)
    if ('error' in result && result.error) {
      setError(result.error)
      return
    }
    if ('slug' in result && result.slug) navigate({ to: '/recipes/$slug', params: { slug: result.slug } })
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <p className="eyebrow">Your kitchen</p>
      <h1 className="mt-2 font-display text-4xl font-black">Add a recipe</h1>
      <p className="mt-3 text-ink-soft">Your recipe is now saved to your Cook &amp; Flame account, not just this browser.</p>

      {error ? <div className="mt-6 border border-ember/40 bg-paper-2 p-4 text-sm text-ember">{error}</div> : null}

      <form onSubmit={submit} className="mt-8 space-y-7">
        <section className="grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2"><span className="label">Title</span><input required name="title" className="input" placeholder="Spicy honey chicken" /></label>
          <label className="sm:col-span-2"><span className="label">Description</span><textarea name="description" className="input min-h-24" /></label>
          <label><span className="label">Category</span><select name="category" className="input"><option>breakfast</option><option>lunch</option><option>dinner</option><option>dessert</option><option>snack</option></select></label>
          <label><span className="label">Cuisine</span><input required name="cuisine" className="input" placeholder="Italian" /></label>
          <label><span className="label">Difficulty</span><select name="difficulty" className="input"><option>easy</option><option>medium</option><option>hard</option></select></label>
          <label><span className="label">Servings</span><input name="servings" type="number" min="1" defaultValue="2" className="input" /></label>
          <label><span className="label">Prep minutes</span><input name="prepTime" type="number" min="0" defaultValue="10" className="input" /></label>
          <label><span className="label">Cook minutes</span><input name="cookTime" type="number" min="0" defaultValue="20" className="input" /></label>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between"><h2 className="font-display text-xl font-bold">Ingredients</h2><button type="button" className="text-sm font-bold text-ember" onClick={() => setIngredients([...ingredients, emptyIngredient()])}><Plus size={15} className="mr-1 inline" />Add</button></div>
          {ingredients.map((x, i) => <div className="mb-2 flex gap-2" key={i}><input className="input" placeholder="Amount" value={x.amount} onChange={e => setIngredients(ingredients.map((v,j) => j === i ? {...v, amount:e.target.value} : v))} /><input className="input" placeholder="Ingredient" value={x.item} onChange={e => setIngredients(ingredients.map((v,j) => j === i ? {...v, item:e.target.value} : v))} />{ingredients.length > 1 && <button type="button" className="p-2 text-ink-faint" onClick={() => setIngredients(ingredients.filter((_,j) => j !== i))}><Trash2 size={17} /></button>}</div>)}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between"><h2 className="font-display text-xl font-bold">Instructions</h2><button type="button" className="text-sm font-bold text-ember" onClick={() => setInstructions([...instructions, ''])}><Plus size={15} className="mr-1 inline" />Step</button></div>
          {instructions.map((x, i) => <div className="mb-3 flex gap-3" key={i}><span className="mt-3 font-bold text-ink-faint">{i + 1}</span><textarea required className="input min-h-20" value={x} onChange={e => setInstructions(instructions.map((v,j) => j === i ? e.target.value : v))} /></div>)}
        </section>

        <button disabled={saving} className="btn btn-primary w-full" type="submit">{saving ? 'Saving…' : 'Save recipe'}</button>
      </form>
    </main>
  )
}
