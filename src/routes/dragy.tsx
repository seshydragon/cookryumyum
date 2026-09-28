import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Bot, Send, Sparkles } from 'lucide-react'
import { recipes } from '../data/recipes'

export const Route = createFileRoute('/dragy')({ component: Dragy })
type Message = { role: 'user' | 'assistant'; text: string }

function answer(input: string) {
  const q = input.toLowerCase()
  if (q.includes('substitute') || q.includes('instead')) return 'Tell me the ingredient you are replacing and I can suggest swaps based on the recipe.'
  if (q.includes('plan') || q.includes('dinner')) return 'For a quick weeknight, try one of the recipes under 25 minutes, then use Meal Planner to map the week.'
  if (q.includes('protein')) {
    const high = [...recipes].sort((a,b) => b.macros.protein - a.macros.protein).slice(0,3)
    return 'Try ' + high.map(r => r.title).join(', ') + '. They have some of the higher listed protein per serving on the shelf.'
  }
  if (q.includes('quick') || q.includes('fast')) {
    const quick = recipes.filter(r => r.minutes <= 20).slice(0,3)
    return 'Quick picks: ' + quick.map(r => r.title).join(', ') + '.'
  }
  return 'I can help you pick recipes, plan meals, compare the shelf, or work through substitutions. What are you cooking?'
}
const SUGGESTIONS = ['Plan my dinners for the week', 'Give me a quick high-protein recipe', 'What can I substitute?', 'What should I cook tonight?']

function Dragy() {
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', text: 'Hey! I’m Dragy, your Cook & Flame kitchen assistant. Ask me what to cook, how to plan the week, or what to swap.' }])
  const [input, setInput] = useState('')
  const send = () => {
    const text = input.trim()
    if (!text) return
    setMessages(m => [...m, { role: 'user', text }, { role: 'assistant', text: answer(text) }])
    setInput('')
  }
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <header className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ember/12 text-ember"><Bot size={24}/></span>
        <div><p className="eyebrow flex items-center gap-1.5"><Sparkles size={13}/> Dragy</p><h1 className="mt-1 font-display text-4xl font-black">Your kitchen sidekick.</h1><p className="mt-3 text-ink-soft">Recipe-aware assistant built into Cook &amp; Flame.</p></div>
      </header>
      <div className="card mt-8 overflow-hidden">
        <div className="min-h-[420px] space-y-4 p-5">
          {messages.map((m, i) => <div key={i} className={m.role === 'user' ? 'ml-auto max-w-[80%] bg-ink px-4 py-3 text-paper' : 'max-w-[80%] bg-paper-2 px-4 py-3 text-ink'}><p className="text-sm leading-relaxed">{m.text}</p></div>)}
        </div>
        <div className="border-t border-paper-3 p-4">
          <div className="flex flex-wrap gap-2 pb-3">{SUGGESTIONS.map(s => <button key={s} className="chip" onClick={() => setInput(s)}>{s}</button>)}</div>
          <form className="flex gap-2" onSubmit={e => { e.preventDefault(); send() }}><input className="field flex-1" value={input} onChange={e => setInput(e.target.value)} placeholder="Ask Dragy..." /><button className="btn btn-primary" aria-label="Send"><Send size={16}/></button></form>
        </div>
      </div>
    </div>
  )
}
