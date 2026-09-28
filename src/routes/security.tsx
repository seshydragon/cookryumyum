import { Link, createFileRoute } from '@tanstack/react-router'
import { Cookie, Database, Fingerprint, KeyRound, ShieldCheck, Timer } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const Route = createFileRoute('/security')({
  component: Security,
})

const MEASURES: Array<{ icon: LucideIcon; title: string; body: string }> = [
  {
    icon: KeyRound,
    title: 'Passwords are hashed, never stored',
    body: 'Every password goes through bcrypt at cost factor 12 before it touches the database. The plain password exists only in memory for the moment it takes to hash or compare it, and nothing in the schema can hold one.',
  },
  {
    icon: Fingerprint,
    title: 'Sessions are stored as a digest',
    body: 'When you sign in, a random token goes into your cookie and only its SHA-256 digest is written to the sessions table. A leaked database dump therefore contains nothing that can be replayed as a login, because the digest cannot be turned back into a cookie.',
  },
  {
    icon: Cookie,
    title: 'The cookie is locked down',
    body: 'The session cookie is HttpOnly so no script can read it, Secure in production so it never crosses plain HTTP, SameSite=strict so another site cannot make requests as you, and scoped to the site root.',
  },
  {
    icon: Timer,
    title: 'Sessions expire and can be ended',
    body: 'A session lasts thirty days and the expiry is enforced on the server, not just in the cookie. Signing out deletes the row and clears the cookie, so the token is dead even if it was copied.',
  },
  {
    icon: ShieldCheck,
    title: 'Failed sign-ins give nothing away',
    body: 'A wrong password and an email with no account return the same message, and a missing account is still compared against a dummy hash so the two take a similar amount of time. Neither the message nor the timing tells someone whether an email is registered.',
  },
  {
    icon: Database,
    title: 'Input is validated on the server',
    body: 'Every server function validates its own input with a schema rather than trusting the browser, queries are parameterised through the ORM, and uploads are checked for type and size before a single byte is stored.',
  },
]

function Security() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-20">
      <p className="eyebrow">Accounts</p>
      <h1 className="mt-2 font-display text-4xl leading-[1.05] font-black sm:text-5xl">
        How accounts are protected
      </h1>
      <p className="mt-5 text-lg leading-relaxed text-ink-soft">
        COOKr holds an email, a display name, and a log of what you cooked. That is not much,
        but it is yours, so here is exactly what happens to it — in plain terms, with no
        claims we have not built.
      </p>

      <hr className="rule my-10" />

      <div className="flex flex-col gap-9">
        {MEASURES.map(({ icon: Icon, title, body }) => (
          <section key={title} className="flex gap-4">
            <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-ember/12 text-ember">
              <Icon size={19} />
            </span>
            <div>
              <h2 className="font-display text-xl leading-snug font-bold">{title}</h2>
              <p className="mt-2 leading-relaxed text-ink-soft">{body}</p>
            </div>
          </section>
        ))}
      </div>

      <hr className="rule my-10" />

      <h2 className="font-display text-2xl font-black">What we do not collect</h2>
      <ul className="mt-4 flex flex-col gap-2.5 leading-relaxed text-ink-soft">
        <li className="flex gap-3">
          <span className="text-ember">—</span> No payment details. There is nothing to pay
          for.
        </li>
        <li className="flex gap-3">
          <span className="text-ember">—</span> No contacts, location, or device
          fingerprinting.
        </li>
        <li className="flex gap-3">
          <span className="text-ember">—</span> No third-party analytics or advertising
          trackers.
        </li>
        <li className="flex gap-3">
          <span className="text-ember">—</span> Nothing you cook is public unless you enter a
          challenge, and a challenge entry is a photo and a caption you chose to upload.
        </li>
      </ul>

      <div className="card mt-12 p-6">
        <h2 className="font-display text-xl font-bold">Found something wrong?</h2>
        <p className="mt-2 leading-relaxed text-ink-soft">
          If you spot a way to get at an account that is not yours, tell us before you tell
          anyone else and we will fix it first.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/signup" className="btn btn-primary">
            Start a kitchen
          </Link>
          <Link to="/recipes" className="btn btn-ghost">
            Browse the shelf
          </Link>
        </div>
      </div>
    </div>
  )
}
