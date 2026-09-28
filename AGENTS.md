# AGENTS.md

Orientation for developers and agents working on COOKr — a recipe shelf with weekly cooking
challenges and a gamified cooking log. Brand voice: Cook and Flame studio, "cook what you
already have". Plain, practical, a bit dry; no exclamation marks, no emojis in the UI.

## Tech stack

| Layer | Technology |
|---|---|
| Framework | TanStack Start 1.167 |
| Frontend | React 19, TanStack Router v1 |
| Build | Vite 7 |
| Styling | Tailwind CSS 4 (`@theme` tokens in `src/styles.css`) |
| Database | Netlify Database (Postgres) + Drizzle ORM (`1.0.0-beta`) |
| Object storage | Netlify Blobs (`challenge-photos` store) |
| Images | Netlify Image CDN via `src/lib/img.ts` |
| Auth | bcryptjs + digest-only session rows, hand-rolled in `src/server/auth.server.ts` |
| Language | TypeScript 5.9 |

## Structure

```
db/
  schema.ts                   all eight tables; snake_case columns, camelCase exports
  index.ts                    drizzle({ schema }) over drizzle-orm/netlify-db
drizzle.config.ts             out: netlify/database/migrations
netlify/database/migrations/  generated; Netlify applies these on deploy
scripts/
  image-prompts.json          one prompt per photo, plus the shared style string
  generate-images.mjs         renders anything missing from public/img
src/
  data/recipes.ts             24 recipes + CUISINES, TIMES_OF_DAY, count helpers
  data/challenges.ts          the 6-challenge rota + ISO-week selection
  data/progress.ts            LEVELS, XP table, BADGES, levelFor()
  lib/shelf.ts                ShelfFilters and applyFilters()
  lib/img.ts                  the only place that builds /.netlify/images URLs
  server/auth.server.ts       register, login, sessions, currentUser, requireUser
  server/kitchen.server.ts    cook logs, XP, streaks, badge rules, challenges, boards
  server/kitchen.functions.ts createServerFn wrappers — the only server surface the
                              client imports
  components/                 ShelfSidebar, RecipeCard, CookedItButton, XpBar, …
  routes/                     file-based routes
```

## Conventions that matter

**Server code stays in `*.server.ts`.** Routes and components import from
`kitchen.functions.ts` only. Anything that touches `db`, Blobs or cookies lives behind a
server function.

**Server functions use `.inputValidator()`, not `.validator()`.** Zod schema in, validated
`data` out. Mutations are `createServerFn({ method: 'POST' })`.

**Filters live in the URL.** `src/routes/recipes/index.tsx` declares `validateSearch`, and
`ShelfSidebar` writes through `navigate({ search })`. Never hold filter state in a component
and never add a filter without adding it to `ShelfFilters`.

**XP is an append-only ledger.** `xp_events` rows are never updated, and the level is derived
at read time by `levelFor()`. Retuning `LEVELS` therefore needs no migration.

**Badges are idempotent.** `evaluateBadges(userId)` re-checks all 12 rules after every
relevant action and relies on the unique index plus `onConflictDoNothing()`. Add a rule there
and a definition in `BADGES`; nothing else changes.

**The weekly challenge has no scheduler.** `activeChallenge()` is `CHALLENGES[isoWeek() %
CHALLENGES.length]`, so the week is a pure function of the date.

**Images never link to an original.** Always `img(path, { w })`. Originals in `public/img` are
progressive JPEG at 1408×768; do not request a width above 1408 or a crop that would upscale.

**No emojis in the interface.** Icons come from `lucide-react`; badge icons map through
`src/components/BadgeIcon.tsx`, and avatars are initials on a palette swatch.

## Database work

1. Edit `db/schema.ts`.
2. `npx drizzle-kit generate --name snake_case_summary`.
3. Commit the generated folder under `netlify/database/migrations`.

Never apply a migration locally — Netlify runs them at deploy time. Never use local JSON,
in-memory maps or an external database for anything that has to persist; the Netlify
primitives are the storage layer.

## Auth invariants

- Passwords: bcrypt cost 12, hashed before they reach the database.
- Sessions: random token in the cookie, SHA-256 digest in `sessions.token_digest`, compared
  with `timingSafeEqual`, expiry enforced server-side.
- Cookie: HttpOnly, Secure in production, SameSite=strict, path `/`, 30 days.
- Login failures return one generic message and compare against a dummy hash when the account
  does not exist, so neither the wording nor the timing reveals whether an email is
  registered.

Do not weaken any of these for convenience, and keep `/security` in step with what the code
actually does.

## Adding a recipe

1. Append to `recipes` in `src/data/recipes.ts` — every field is required, `timeOfDay` takes
   as many values as genuinely apply.
2. Add a prompt to `scripts/image-prompts.json` with `file: "recipes/<slug>.jpg"`.
3. `pnpm images`.
4. If the cuisine is new, add it to `CUISINES`.
