import { useState } from 'react'
import { Link, createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { ShieldCheck } from 'lucide-react'
import { AuthShell } from '../components/AuthShell'
import { signIn } from '../server/kitchen.functions'

export const Route = createFileRoute('/login')({
  component: Login,
})

function Login() {
  const router = useRouter()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    if (!email.trim() || !password) {
      setError('Both fields, please.')
      return
    }

    setBusy(true)
    try {
      const res = (await signIn({ data: { email: email.trim(), password } })) as {
        error?: string
        userId?: number
      }

      if (res.error) {
        setError(res.error)
        setBusy(false)
        return
      }

      await router.invalidate()
      navigate({ to: '/kitchen' })
    } catch {
      setError('Something went wrong signing you in. Try again.')
      setBusy(false)
    }
  }

  return (
    <AuthShell
      image="/img/recipes/cacio-e-pepe.jpg"
      imageAlt="A bowl of cacio e pepe being tossed, pepper visible in the sauce"
      quote="The shelf remembers what you cooked. That is the whole trick."
    >
      <p className="eyebrow">Welcome back</p>
      <h1 className="mt-2 font-display text-3xl leading-tight font-black sm:text-4xl">
        Sign in to your kitchen
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-soft">
        Your XP, streak, badges and challenge entries are waiting exactly where you left
        them.
      </p>

      <form onSubmit={onSubmit} className="mt-7 flex flex-col gap-4" noValidate>
        <label className="block">
          <span className="eyebrow mb-1.5 block">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            autoFocus
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
            autoComplete="current-password"
            className="field"
            placeholder="••••••••••"
          />
        </label>

        {error ? (
          <p role="alert" className="text-sm font-semibold text-ember">
            {error}
          </p>
        ) : null}

        <button type="submit" disabled={busy} className="btn btn-primary w-full">
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-sm text-ink-soft">
        No kitchen yet?{' '}
        <Link to="/signup" className="font-semibold text-ember hover:underline">
          Start one
        </Link>
        .
      </p>

      <Link
        to="/security"
        className="mt-8 flex items-start gap-2.5 border-t border-paper-3 pt-5 text-xs leading-relaxed text-ink-faint hover:text-ink-soft"
      >
        <ShieldCheck size={15} className="mt-px shrink-0" />
        <span>
          Passwords are hashed with bcrypt and sessions are stored as a digest, so a
          database dump cannot be replayed as a login. How accounts are protected.
        </span>
      </Link>
    </AuthShell>
  )
}
