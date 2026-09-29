import { useEffect, useMemo, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Camera, LoaderCircle, Plus, RotateCcw, Trash2, Upload } from 'lucide-react'
import {
  analyzeMealPhoto,
  clearMyMacroLog,
  deleteMyMacroLog,
  getMyMacroLog,
  getSession,
  getShelfRecipes,
  saveMacroLog,
} from '../server/kitchen.functions'

export const Route = createFileRoute('/macro-tracker')({ component: MacroTracker })

type Entry = {
  id: number
  title: string
  calories: number
  protein: number
  carbs: number
  fat: number
  items: Array<{ name: string; calories: number; protein: number; carbs: number; fat: number }>
  notes: string
  source: string
}

type Analysis = {
  title: string
  items: Array<{ name: string; calories: number; protein: number; carbs: number; fat: number }>
  totals: { calories: number; protein: number; carbs: number; fat: number }
  notes: string[]
}

function todayLocal() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function fileAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not read image'))
    reader.onerror = () => reject(reader.error ?? new Error('Could not read image'))
    reader.readAsDataURL(file)
  })
}

async function preparePhoto(file: File) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Use a JPEG, PNG or WebP photo.')
  }

  const source = URL.createObjectURL(file)
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('That image could not be opened.'))
      img.src = source
    })

    const maxSide = 1600
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight))
    const width = Math.max(1, Math.round(image.naturalWidth * scale))
    const height = Math.max(1, Math.round(image.naturalHeight * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Your browser could not prepare that image.')

    ctx.drawImage(image, 0, 0, width, height)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82))
    if (!blob) throw new Error('Your browser could not prepare that image.')

    const dataUrl = await fileAsDataUrl(blob)
    const comma = dataUrl.indexOf(',')
    if (comma < 0) throw new Error('That image could not be prepared.')

    return {
      data: dataUrl.slice(comma + 1),
      contentType: 'image/jpeg' as const,
      preview: dataUrl,
    }
  } finally {
    URL.revokeObjectURL(source)
  }
}

function MacroTracker() {
  const loggedOn = todayLocal()
  const [signedIn, setSignedIn] = useState(false)
  const [entries, setEntries] = useState<Entry[]>([])
  const [shelfRecipes, setShelfRecipes] = useState<Awaited<ReturnType<typeof getShelfRecipes>>['recipes']>([])
  const [selected, setSelected] = useState('')
  const [photo, setPhoto] = useState<{ data: string; contentType: 'image/jpeg'; preview: string } | null>(null)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    const [session, log, shelf] = await Promise.all([
      getSession(),
      getMyMacroLog({ data: { loggedOn } }),
      getShelfRecipes(),
    ])
    setSignedIn(Boolean(session.user))
    setEntries(log.entries as Entry[])
    setShelfRecipes(shelf.recipes)
    setSelected((current) => current || shelf.recipes[0]?.slug || '')
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  const totals = useMemo(() => entries.reduce((a, e) => ({
    calories: a.calories + e.calories,
    protein: a.protein + e.protein,
    carbs: a.carbs + e.carbs,
    fat: a.fat + e.fat,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 }), [entries])

  async function onPhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError('')
    setAnalysis(null)
    try {
      setPhoto(await preparePhoto(file))
    } catch (err) {
      setPhoto(null)
      setError(err instanceof Error ? err.message : 'Could not prepare that photo.')
    }
  }

  async function analyzePhoto() {
    if (!photo || analyzing) return
    setAnalyzing(true)
    setError('')
    setAnalysis(null)

    try {
      const result = await analyzeMealPhoto({
        data: { data: photo.data, contentType: photo.contentType },
      })

      if ('error' in result && result.error) {
        setError(result.error)
      } else if ('analysis' in result && result.analysis) {
        setAnalysis(result.analysis as Analysis)
      }
    } catch {
      setError('The AI service could not analyze that photo. Try again.')
    } finally {
      setAnalyzing(false)
    }
  }

  async function saveAnalysis() {
    if (!analysis || saving) return
    if (!signedIn) {
      setError('Sign in to save nutrition entries to your account.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const result = await saveMacroLog({
        data: {
          loggedOn,
          title: analysis.title,
          calories: analysis.totals.calories,
          protein: analysis.totals.protein,
          carbs: analysis.totals.carbs,
          fat: analysis.totals.fat,
          items: analysis.items,
          notes: analysis.notes,
          source: 'photo',
        },
      })
      if ('error' in result && result.error) {
        setError(result.error)
      } else {
        setAnalysis(null)
        setPhoto(null)
        await load()
      }
    } catch {
      setError('That entry could not be saved. Try again.')
    } finally {
      setSaving(false)
    }
  }

  async function addRecipe() {
    const recipe = shelfRecipes.find((r) => r.slug === selected)
    if (!recipe) return
    if (!signedIn) {
      setError('Sign in to save nutrition entries to your account.')
      return
    }

    const result = await saveMacroLog({
      data: {
        loggedOn,
        title: recipe.title,
        calories: recipe.macros.calories,
        protein: recipe.macros.protein,
        carbs: recipe.macros.carbs,
        fat: recipe.macros.fat,
        items: [{
          name: recipe.title,
          calories: recipe.macros.calories,
          protein: recipe.macros.protein,
          carbs: recipe.macros.carbs,
          fat: recipe.macros.fat,
        }],
        notes: recipe.macros.calories || recipe.macros.protein
          ? ['Using the nutrition values listed for this Cook & Flame recipe.']
          : ['This community recipe does not have nutrition values listed yet.'],
        source: 'recipe',
      },
    })

    if ('error' in result && result.error) {
      setError(result.error)
      return
    }

    await load()
  }

  async function removeEntry(id: number) {
    await deleteMyMacroLog({ data: { id } })
    await load()
  }

  async function clearDay() {
    await clearMyMacroLog({ data: { loggedOn } })
    setAnalysis(null)
    setPhoto(null)
    await load()
  }

  if (loading) {
    return <main className="mx-auto max-w-5xl px-4 py-12"><p className="text-ink-soft">Loading your nutrition log…</p></main>
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <header className="max-w-3xl">
        <p className="eyebrow flex items-center gap-2"><Camera size={13} /> Macro tracker</p>
        <h1 className="mt-2 font-display text-4xl font-black sm:text-5xl">See what is on the plate.</h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-soft">
          Snap a meal and Dragy’s AI can estimate the visible food and nutrition. You can also log Cook &amp; Flame recipes directly.
          Estimates can be off because photos cannot reliably reveal every ingredient or portion size.
        </p>
        {!signedIn ? (
          <p className="mt-4 text-sm text-ink-soft">
            <Link to="/login" className="font-bold text-ember hover:underline">Sign in</Link> to keep your daily log across devices.
          </p>
        ) : null}
      </header>

      {error ? <div role="alert" className="mt-6 border border-ember/40 bg-paper-2 p-4 text-sm font-semibold text-ember">{error}</div> : null}

      <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ['Calories', totals.calories, 'kcal'],
          ['Protein', totals.protein, 'g'],
          ['Carbs', totals.carbs, 'g'],
          ['Fat', totals.fat, 'g'],
        ].map(([label, value, unit]) => (
          <div key={String(label)} className="card p-4">
            <p className="eyebrow">{label}</p>
            <p className="mt-2 font-display text-3xl font-black tabular-nums">
              {value}<span className="ml-1 text-sm font-normal text-ink-faint">{unit}</span>
            </p>
          </div>
        ))}
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <section className="card p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">AI photo scan</p>
              <h2 className="mt-1 font-display text-2xl font-black">What did I eat?</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">Upload a food photo. The image is sent to the configured Nara vision model for an estimate.</p>
            </div>
            <Upload size={20} className="text-ember" />
          </div>

          <label className="mt-5 flex min-h-48 cursor-pointer flex-col items-center justify-center border border-dashed border-paper-3 bg-paper-2/50 p-6 text-center hover:border-ember">
            {photo ? (
              <img src={photo.preview} alt="Meal selected for nutrition analysis" className="max-h-64 w-full rounded-sm object-contain" />
            ) : (
              <>
                <Camera size={32} className="text-ink-faint" />
                <span className="mt-3 font-bold">Choose a meal photo</span>
                <span className="mt-1 text-xs text-ink-faint">JPEG, PNG or WebP</span>
              </>
            )}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={onPhotoChange} />
          </label>

          <button className="btn btn-primary mt-4 w-full" disabled={!photo || analyzing} onClick={() => void analyzePhoto()}>
            {analyzing ? <><LoaderCircle size={16} className="animate-spin" /> Analyzing…</> : <><Camera size={16} /> Analyze photo</>}
          </button>

          {analysis ? (
            <div className="mt-5 border border-paper-3 bg-paper-2/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="eyebrow">AI estimate</p>
                  <h3 className="mt-1 font-display text-xl font-black">{analysis.title}</h3>
                </div>
                <button className="btn btn-ghost py-1.5 text-xs" disabled={saving || !signedIn} onClick={() => void saveAnalysis()}>
                  {saving ? 'Saving…' : 'Save to today'}
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  ['Calories', analysis.totals.calories, 'kcal'],
                  ['Protein', analysis.totals.protein, 'g'],
                  ['Carbs', analysis.totals.carbs, 'g'],
                  ['Fat', analysis.totals.fat, 'g'],
                ].map(([label, value, unit]) => (
                  <div key={String(label)} className="border border-paper-3 p-2.5">
                    <p className="text-[0.6875rem] uppercase tracking-wide text-ink-faint">{label}</p>
                    <p className="mt-1 font-bold">{value}{unit === 'kcal' ? ' kcal' : `g ${String(label).toLowerCase()}`}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <p className="eyebrow mb-2">Visible foods</p>
                <div className="space-y-2">
                  {analysis.items.map((item) => (
                    <div key={item.name} className="flex items-center justify-between gap-3 border-b border-paper-3 pb-2 text-sm last:border-0">
                      <span className="font-semibold">{item.name}</span>
                      <span className="text-ink-soft">{item.calories} kcal · {item.protein}g protein</span>
                    </div>
                  ))}
                </div>
              </div>

              {analysis.notes.length ? (
                <div className="mt-4 text-xs leading-relaxed text-ink-faint">
                  {analysis.notes.join(' ')}
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="card p-5">
          <p className="eyebrow">Recipe log</p>
          <h2 className="mt-1 font-display text-2xl font-black">Add from the shelf</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">Use the nutrition already listed on a Cook &amp; Flame recipe.</p>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <select className="field flex-1" value={selected} onChange={(e) => setSelected(e.target.value)}>
              {shelfRecipes.map((r) => <option key={r.slug} value={r.slug}>{r.title}</option>)}
            </select>
            <button className="btn btn-primary" disabled={!selected || !signedIn} onClick={() => void addRecipe()}>
              <Plus size={15} /> Add meal
            </button>
          </div>

          <div className="mt-5 border border-paper-3 bg-paper-2/40 p-4 text-sm leading-relaxed text-ink-soft">
            Community recipes created without nutrition fields will appear as zero until nutrition is added later. That is intentional; the app does not invent nutrition for those recipes.
          </div>
        </section>
      </div>

      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Today</p>
            <h2 className="mt-1 font-display text-2xl font-black">{entries.length} logged meal{entries.length === 1 ? '' : 's'}</h2>
          </div>
          {entries.length ? (
            <button className="btn btn-ghost" onClick={() => void clearDay}><RotateCcw size={15} /> Clear today</button>
          ) : null}
        </div>
        <hr className="rule mt-3 mb-5" />

        {entries.length ? (
          <div className="card divide-y divide-paper-3">
            {entries.map((entry) => (
              <div key={entry.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-semibold">{entry.title}</p>
                  {entry.notes ? <p className="mt-1 text-xs leading-relaxed text-ink-faint">{entry.notes}</p> : null}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-right text-sm text-ink-soft">
                    {entry.calories} kcal · {entry.protein}g protein · {entry.carbs}g carbs · {entry.fat}g fat
                  </span>
                  <button aria-label={`Remove ${entry.title}`} className="text-ink-faint hover:text-ember" onClick={() => void removeEntry(entry.id)}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-faint">Nothing logged yet. Scan a meal photo or pick a recipe above.</p>
        )}
      </section>
    </main>
  )
}
