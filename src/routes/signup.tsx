import { useState } from 'react'
import { Link, createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { Check, X } from 'lucide-react'
import { AuthShell } from '../components/AuthShell'
import { signUp } from '../server/kitchen.functions'

export const Route = createFileRoute('/signup')({
  component: SignUp,
})

function SignUp() {
  const router = useRouter()
  const navigate = useNavigate()

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const checks = [
    { label: 'At least 10 characters', ok: password.length >= 10 },
    { label: 'Contains a letter', ok: /[a-z]/i.test(password) },
    { label: 'Contains a number', ok: /\d/.test(password) },
  ]
  const passwordReady = checks.every((c) => c.ok)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    if (displayName.trim().length < 2) {
      setError('Tell us what to call you.')
      return
    }
    if (!passwordReady) {
      setError('The password needs all three of those.')
      return
    }

    setBusy(true)
    try {
      const res = (await signUp({
        data: { email: email.trim(), password, displayName: displayName.trim() },
      })) as { error?: string; userId?: number }

      if (res.error) {
        setError(res.error)
        setBusy(false)
        return
      }

      await router.invalidate()
      navigate({ to: '/kitchen' })
    } catch {
      setError('Something went wrong creating your kitchen. Try again.')
      setBusy(false)
    }
  }

  return (
    <AuthShell
      image="/img/recipes/shakshuka-feta-dill.jpg"
      imageAlt="A pan of shakshuka with feta and dill, bread torn beside it"
      quote="Start with what is already in the cupboard. Cook that well."
    >
      <p className="eyebrow">New here</p>
      <h1 className="mt-2 font-display text-3xl leading-tight font-black sm:text-4xl">
        Start a kitchen
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-soft">
        An account is what turns the shelf into a record: XP for the nights you cook, a
        streak worth keeping, badges, and a name on the weekly challenge board.
      </p>

      <form onSubmit={onSubmit} className="mt-7 flex flex-col gap-4" noValidate>
        <label className="block">
          <span className="eyebrow mb-1.5 block">What should we call you?</span>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value.slice(0, 40))}
            autoComplete="nickname"
            autoFocus
            className="field"
            placeholder="Sam"
          />
          <span className="mt-1 block text-xs text-ink-faint">
            This is the name on the leaderboards.
          </span>
        </label>

        <label className="block">
          <span className="eyebrow mb-1.5 block">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="field"
            placeholder="you@example.com"
          />
        </label>

        <label className="block">
          <span className="eyebrow mb-1.5 block">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            className="field"
            placeholder="Ten characters or more"
          />
        </label>

        <ul className="flex flex-col gap-1">
          {checks.map((check) => (
            <li
              key={check.label}
              className="flex items-center gap-2 text-xs"
              style={{
                color: check.ok ? 'var(--color-olive)' : 'var(--color-ink-faint)',
              }}
            >
              {check.ok ? <Check size={13} /> : <X size={13} />}
              {check.label}
            </li>
          ))}
        </ul>

        {error ? (
          <p role="alert" className="text-sm font-semibold text-ember">
            {error}
          </p>
        ) : null}

        <button type="submit" disabled={busy} className="btn btn-primary w-full">
          {busy ? 'Setting up…' : 'Start cooking'}
        </button>
      </form>

      <p className="mt-6 text-sm text-ink-soft">
        Already have one?{' '}
        <Link to="/login" className="font-semibold text-ember hover:underline">
          Sign in
        </Link>
        .
      </p>
    </AuthShell>
  )
}
