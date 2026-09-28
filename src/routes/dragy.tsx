import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Bot, Send, Sparkles } from 'lucide-react'
import { chatWithDragy } from '../server/kitchen.functions'

export const Route = createFileRoute('/dragy')({ component: Dragy })

type Message = { role: 'user' | 'assistant'; text: string }

const SUGGESTIONS = [
  'Plan my dinners for the week',
  'Give me a quick high-protein recipe',
  'What can I substitute for eggs?',
  'What should I cook tonight?',
]

function Dragy() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: 'Hey! I’m Dragy, your Cook & Flame kitchen assistant. Ask me what to cook, how to plan the week, or what to swap.' },
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)

  async function send(textOverride?: string) {
    const text = (textOverride ?? input).trim()
    if (!text || sending) return
    const next = [...messages, { role: 'user' as const, text }]
    setMessages(next)
    setInput('')
    setSending(true)
    try {
      const result = await chatWithDragy({ data: { messages: next } })
      setMessages((current) => [...current, {
        role: 'assistant',
        text: 'text' in result && result.text ? result.text : ('error' in result && result.error ? result.error : 'Dragy could not answer that right now.'),
      }])
    } catch {
      setMessages((current) => [...current, { role: 'assistant', text: 'Dragy hit a connection error. Try again in a moment.' }])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <header className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ember/12 text-ember"><Bot size={24}/></span>
        <div><p className="eyebrow flex items-center gap-1.5"><Sparkles size={13}/> Dragy</p><h1 className="mt-1 font-display text-4xl font-black">Your kitchen sidekick.</h1><p className="mt-3 text-ink-soft">Recipe-aware AI powered by your Cook &amp; Flame shelf.</p></div>
      </header>
      <div className="card mt-8 overflow-hidden">
        <div className="min-h-[420px] space-y-4 p-5">
          {messages.map((m, i) => <div key={i} className={m.role === 'user' ? 'ml-auto max-w-[80%] bg-ink px-4 py-3 text-paper' : 'max-w-[80%] bg-paper-2 px-4 py-3 text-ink'}><p className="whitespace-pre-wrap text-sm leading-relaxed">{m.text}</p></div>)}
          {sending && <div className="max-w-[80%] bg-paper-2 px-4 py-3 text-ink"><p className="text-sm text-ink-soft">Dragy is thinking…</p></div>}
        </div>
        <div className="border-t border-paper-3 p-4">
          <div className="flex flex-wrap gap-2 pb-3">{SUGGESTIONS.map(s => <button key={s} className="chip" disabled={sending} onClick={() => send(s)}>{s}</button>)}</div>
          <form className="flex gap-2" onSubmit={e => { e.preventDefault(); void send() }}><input className="field flex-1" value={input} disabled={sending} onChange={e => setInput(e.target.value)} placeholder="Ask Dragy..." /><button className="btn btn-primary" disabled={sending || !input.trim()} aria-label="Send"><Send size={16}/></button></form>
        </div>
      </div>
    </div>
  )
}
