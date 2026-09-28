import { useRef, useState } from 'react'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { Crown, Heart, ImagePlus, Timer, Trophy } from 'lucide-react'
import { Avatar } from '../components/Avatar'
import { RecipeCard } from '../components/RecipeCard'
import {
  activeChallenge,
  daysLeftInChallenge,
  previousChallenge,
} from '../data/challenges'
import { getRecipe, recipes } from '../data/recipes'
import { img } from '../lib/img'
import { getChallengeBoard, submitEntry, vote } from '../server/kitchen.functions'

export const Route = createFileRoute('/challenges')({
  loader: async () => {
    try {
      const board = await getChallengeBoard()
      return { board, daysLeft: daysLeftInChallenge() }
    } catch {
      return { board: null, daysLeft: daysLeftInChallenge() }
    }
  },
  component: Challenges,
})

type Entry = {
  id: number
  cook: { id: number; displayName: string; avatar: string }
  recipe: { slug: string; title: string }
  photoUrl: string
  caption: string
  votes: number
  votedByViewer: boolean
  isOwn: boolean
}

function Challenges() {
  const { board, daysLeft } = Route.useLoaderData()
  const challenge = activeChallenge()
  const last = previousChallenge()

  const suggested = challenge.suggested
    .map((slug) => getRecipe(slug))
    .filter((r) => r !== undefined)

  return (
    <div>
      <section className="relative overflow-hidden border-b border-paper-3">
        <img
          src={img('/img/challenge-banner.jpg', { w: 1400, h: 560 })}
          alt="Six home-cooked dishes crowded onto a long dark table"
          width={1400}
          height={560}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/94 via-ink/80 to-ink/40" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
          <p className="eyebrow text-ember-soft">This week’s challenge</p>
          <h1 className="mt-2 max-w-2xl font-display text-4xl leading-[1.03] font-black text-paper sm:text-6xl">
            {challenge.title}
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-paper/85">
            {challenge.prompt}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-3 text-sm text-paper/80">
            <span className="flex items-center gap-2">
              <Timer size={16} className="text-ember-soft" />
              {daysLeft === 1 ? 'Closes tomorrow' : `${daysLeft} days left`}
            </span>
            <span className="flex items-center gap-2">
              <Trophy size={16} className="text-ember-soft" />
              60 XP to enter, 8 XP per vote you collect
            </span>
            <span className="flex items-center gap-2">
              <Heart size={16} className="text-ember-soft" />
              {board?.entries.length ?? 0} plates in so far
            </span>
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-paper/70">
            {challenge.rules.map((rule) => (
              <li key={rule} className="flex items-baseline gap-2">
                <span className="text-ember-soft">—</span>
                {rule}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-black">The gallery</h2>
                <p className="mt-1 text-sm text-ink-soft">
                  One vote per plate, and never for your own.
                </p>
              </div>
            </div>
            <hr className="rule mt-3 mb-6" />

            {board?.entries.length ? (
              <div className="stagger grid grid-cols-1 gap-5 sm:grid-cols-2">
                {board.entries.map((entry, i) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry as Entry}
                    signedIn={board.signedIn}
                    leader={i === 0 && entry.votes > 0}
                  />
                ))}
              </div>
            ) : (
              <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-sm bg-ember/12 text-ember">
                  <ImagePlus size={22} />
                </span>
                <h3 className="font-display text-xl font-bold">
                  Nobody has cooked yet this week
                </h3>
                <p className="max-w-sm text-sm leading-relaxed text-ink-soft">
                  The board is empty, which means whoever posts first sets the bar. Pick
                  something from the suggestions and get a photo up.
                </p>
              </div>
            )}

            {board?.lastWinner ? (
              <section className="mt-16">
                <h2 className="font-display text-2xl font-black">Last week took it</h2>
                <hr className="rule mt-3 mb-6" />
                <div className="card grid gap-0 overflow-hidden sm:grid-cols-[240px_minmax(0,1fr)]">
                  <img
                    src={board.lastWinner.photoUrl}
                    alt={`${board.lastWinner.cook.displayName}’s ${board.lastWinner.recipe.title}`}
                    className="h-full max-h-56 w-full object-cover"
                  />
                  <div className="p-5">
                    <p className="eyebrow flex items-center gap-1.5 text-gold">
                      <Crown size={13} /> {last.title}
                    </p>
                    <p className="mt-2 font-display text-xl font-bold">
                      {board.lastWinner.recipe.title}
                    </p>
                    {board.lastWinner.caption ? (
                      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                        “{board.lastWinner.caption}”
                      </p>
                    ) : null}
                    <div className="mt-4 flex items-center gap-2.5">
                      <Avatar
                        name={board.lastWinner.cook.displayName}
                        swatch={board.lastWinner.cook.avatar}
                        size={30}
                      />
                      <span className="text-sm font-bold">
                        {board.lastWinner.cook.displayName}
                      </span>
                      <span className="text-sm text-ink-faint">
                        · {board.lastWinner.votes}{' '}
                        {board.lastWinner.votes === 1 ? 'vote' : 'votes'}
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            ) : null}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <EntryForm
              signedIn={Boolean(board?.signedIn)}
              hasEntered={Boolean(board?.hasEntered)}
            />

            <div className="card mt-5 p-5">
              <p className="eyebrow mb-3">Obvious candidates</p>
              <ul className="flex flex-col gap-2.5">
                {suggested.map((r) => (
                  <li key={r.slug}>
                    <Link
                      to="/recipes/$slug"
                      params={{ slug: r.slug }}
                      className="group flex items-center gap-3"
                    >
                      <img
                        src={img(r.image, { w: 96, h: 96 })}
                        alt={r.imageAlt}
                        width={48}
                        height={48}
                        className="h-12 w-12 shrink-0 object-cover"
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold group-hover:text-ember">
                          {r.title}
                        </span>
                        <span className="block text-xs text-ink-faint">
                          {r.cuisine} · {r.minutes} min · {r.macros.protein}g protein
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link to="/recipes" className="btn btn-ghost mt-4 w-full py-2 text-sm">
                Or search the whole shelf
              </Link>
            </div>
          </aside>
        </div>

        <section className="mt-20">
          <h2 className="font-display text-2xl font-black">Cook for next week too</h2>
          <p className="mt-1 text-sm text-ink-soft">
            A new prompt opens every Monday. These rotate in.
          </p>
          <hr className="rule mt-3 mb-6" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recipes
              .filter((r) => r.tags.includes('crowd-pleaser') || r.tags.includes('weekend'))
              .slice(0, 3)
              .map((r) => (
                <RecipeCard key={r.slug} recipe={r} />
              ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function EntryCard({
  entry,
  signedIn,
  leader,
}: {
  entry: Entry
  signedIn: boolean
  leader: boolean
}) {
  const router = useRouter()
  const [votes, setVotes] = useState(entry.votes)
  const [voted, setVoted] = useState(entry.votedByViewer)
  const [message, setMessage] = useState<string | null>(null)

  async function handleVote() {
    if (!signedIn) {
      setMessage('Sign in to vote.')
      return
    }
    // Optimistic: the count moves immediately, and reconciles on invalidate.
    const next = !voted
    setVoted(next)
    setVotes((v) => v + (next ? 1 : -1))

    const res = (await vote({ data: { entryId: entry.id } })) as {
      voted?: boolean
      error?: string
    }

    if (res.error) {
      setVoted(!next)
      setVotes((v) => v + (next ? -1 : 1))
      setMessage(res.error)
      return
    }
    await router.invalidate()
  }

  return (
    <figure className="card card-lift overflow-hidden">
      <div className="relative aspect-4/3 bg-paper-2">
        <img
          src={entry.photoUrl}
          alt={`${entry.cook.displayName}’s ${entry.recipe.title}`}
          loading="lazy"
          className="h-full w-full object-cover"
        />
        {leader ? (
          <span className="absolute top-0 left-0 flex items-center gap-1 bg-gold px-2 py-1 text-[0.6875rem] font-bold tracking-[0.12em] text-paper uppercase">
            <Crown size={11} /> Leading
          </span>
        ) : null}
      </div>

      <figcaption className="p-4">
        <div className="flex items-center gap-2.5">
          <Avatar name={entry.cook.displayName} swatch={entry.cook.avatar} size={30} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{entry.cook.displayName}</p>
            <Link
              to="/recipes/$slug"
              params={{ slug: entry.recipe.slug }}
              className="block truncate text-xs text-ink-faint hover:text-ember"
            >
              {entry.recipe.title}
            </Link>
          </div>

          <button
            type="button"
            onClick={handleVote}
            disabled={entry.isOwn}
            title={entry.isOwn ? 'You cannot vote for your own plate' : 'Vote for this plate'}
            className="flex shrink-0 items-center gap-1.5 border px-2.5 py-1.5 text-sm font-bold transition-colors disabled:opacity-45"
            style={{
              borderColor: voted ? 'var(--color-ember)' : 'var(--color-paper-3)',
              color: voted ? 'var(--color-ember)' : 'var(--color-ink-soft)',
              background: voted ? 'color-mix(in oklab, var(--color-ember) 10%, transparent)' : 'transparent',
            }}
          >
            <Heart size={14} fill={voted ? 'currentColor' : 'none'} />
            <span className="tabular-nums">{votes}</span>
          </button>
        </div>

        {entry.caption ? (
          <p className="mt-3 text-[0.8125rem] leading-relaxed text-ink-soft">
            {entry.caption}
          </p>
        ) : null}

        {message ? (
          <p className="mt-2 text-xs font-semibold text-ember">{message}</p>
        ) : null}
      </figcaption>
    </figure>
  )
}

function EntryForm({
  signedIn,
  hasEntered,
}: {
  signedIn: boolean
  hasEntered: boolean
}) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [recipeSlug, setRecipeSlug] = useState(recipes[0].slug)
  const [caption, setCaption] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  if (!signedIn) {
    return (
      <div className="card p-5">
        <h2 className="font-display text-xl font-bold">Enter this week</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Cook the prompt, photograph the plate before you eat it, and the community votes.
          Entering is worth 60 XP on its own.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <Link to="/signup" className="btn btn-primary w-full">
            Start a kitchen
          </Link>
          <Link to="/login" className="btn btn-ghost w-full">
            Sign in
          </Link>
        </div>
      </div>
    )
  }

  function onPick(file: File | undefined) {
    setError(null)
    if (!file) return
    if (file.size > 6 * 1024 * 1024) {
      setError('That photo is over 6MB. Try a smaller one.')
      return
    }
    setPreview(URL.createObjectURL(file))
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    const file = fileRef.current?.files?.[0]
    if (!file) {
      setError('Add a photo of the plate.')
      return
    }

    setBusy(true)
    try {
      const buffer = await file.arrayBuffer()
      // Chunked so a large photo does not blow the call stack.
      const bytes = new Uint8Array(buffer)
      let binary = ''
      for (let i = 0; i < bytes.length; i += 8192) {
        binary += String.fromCharCode(...bytes.subarray(i, i + 8192))
      }

      const res = (await submitEntry({
        data: {
          recipeSlug,
          caption,
          contentType: file.type,
          data: btoa(binary),
        },
      })) as { error?: string; entryId?: number }

      if (res.error) {
        setError(res.error)
        return
      }

      setDone(true)
      setCaption('')
      setPreview(null)
      if (fileRef.current) fileRef.current.value = ''
      await router.invalidate()
    } catch {
      setError('That upload did not go through. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="card p-5">
      <h2 className="font-display text-xl font-bold">
        {hasEntered ? 'Replace your entry' : 'Enter this week'}
      </h2>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
        {hasEntered
          ? 'You are already on the board. Posting again swaps the photo and keeps your votes.'
          : 'One entry each. Photograph it before you eat it.'}
      </p>

      <div className="mt-4 flex flex-col gap-3">
        <label className="block">
          <span className="eyebrow mb-1.5 block">What did you cook?</span>
          <select
            value={recipeSlug}
            onChange={(e) => setRecipeSlug(e.target.value)}
            className="field"
          >
            {recipes.map((r) => (
              <option key={r.slug} value={r.slug}>
                {r.title}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="eyebrow mb-1.5 block">The photo</span>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => onPick(e.target.files?.[0])}
            className="field cursor-pointer text-sm file:mr-3 file:border-0 file:bg-ink file:px-2.5 file:py-1 file:text-paper"
          />
        </label>

        {preview ? (
          <img
            src={preview}
            alt="Your entry, ready to upload"
            className="pop aspect-4/3 w-full border border-paper-3 object-cover"
          />
        ) : null}

        <label className="block">
          <span className="eyebrow mb-1.5 block">Caption</span>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value.slice(0, 280))}
            rows={3}
            placeholder="What you changed, what went wrong, what you would do next time."
            className="field resize-y"
          />
          <span className="mt-1 block text-right text-xs text-ink-faint">
            {caption.length}/280
          </span>
        </label>
      </div>

      {error ? <p className="mt-2 text-sm font-semibold text-ember">{error}</p> : null}
      {done ? (
        <p className="pop mt-2 text-sm font-semibold text-olive">
          On the board. Good luck.
        </p>
      ) : null}

      <button type="submit" disabled={busy} className="btn btn-primary mt-4 w-full">
        {busy ? 'Uploading…' : hasEntered ? 'Replace my entry' : 'Enter the challenge'}
      </button>
    </form>
  )
}
