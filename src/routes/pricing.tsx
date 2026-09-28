import { Link } from '@tanstack/react-router'

const features=['Community recipes','Meal planner','Macro tracker','Dragy cooking assistant','Challenges & voting','Chef XP, badges & leaderboards']

export default function Pricing(){
  return <main className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
    <div className="mx-auto max-w-2xl text-center"><p className="eyebrow">Cook & Flame</p><h1 className="mt-2 font-display text-5xl font-black">Everything unlocked.</h1><p className="mt-4 text-lg text-ink-soft">No Base44 subscription. The standalone GitHub app keeps the cooking features in one place.</p></div>
    <div className="mx-auto mt-10 max-w-xl border-2 border-ink bg-paper p-8 shadow-[8px_8px_0_var(--color-ink)]"><p className="text-sm font-black uppercase tracking-widest text-ember">Free</p><div className="mt-2 flex items-end gap-2"><span className="font-display text-5xl font-black">$0</span><span className="pb-2 text-ink-soft">forever</span></div><ul className="mt-7 space-y-3">{features.map(x=><li key={x} className="flex gap-3"><span className="text-ember">✓</span><span>{x}</span></li>)}</ul><Link className="btn btn-primary mt-8 w-full" to="/signup">Start cooking</Link></div>
  </main>
}