# COOKr

*Cook what you already have.* — Cook and Flame studio

COOKr is a recipe community with recipe discovery, cooking challenges, chef levels and badges, leaderboards, meal planning, macro tracking, and Dragy AI.

## Stack

| Layer | Choice |
|---|---|
| Framework | TanStack Start (React 19, TanStack Router) |
| Build | Vite 7 with the Cloudflare Vite plugin |
| Hosting | Cloudflare Workers, deployed with Wrangler |
| Styling | Tailwind CSS 4 |
| Data | PostgreSQL through Drizzle ORM and Cloudflare Hyperdrive |
| Challenge photo storage | Supabase Storage |
| Recipe photos | Static assets committed under `public/img` |
| AI | Nara API for Dragy and photo-based macro estimates |
| Language | TypeScript 5.9 |

## Running locally

Use Node.js supported by the installed Wrangler version. From the repository root:

```sh
npm install
npm run dev
```

The app expects a PostgreSQL connection for server-backed features. For local development, set `DATABASE_URL` in a local environment file that is never committed. The photo-storage features also require `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`; Dragy and macro photo analysis use `NARA_API_KEY` (the older `Api_key` name is also accepted).

Do not commit credentials, `.env` files, or `.dev.vars` files.

## Cloudflare deployment

The production app is a server-rendered TanStack Start application. GitHub Pages is static hosting and cannot run its server functions; deploy the app as a Cloudflare Worker instead.

See [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md) for the full checklist.

The normal build and deploy commands are:

```sh
npm run build
npx wrangler deploy
```

Deployment requires a valid Cloudflare Hyperdrive ID in `wrangler.jsonc`, an existing PostgreSQL database with the app's migrations applied, and the required Worker secrets.

## Database changes

The Drizzle schema is in `db/schema.ts`; migration output is configured in `drizzle.config.ts` under `supabase/migrations`.

Generate a migration after changing the schema:

```sh
npx drizzle-kit generate
```

Review the generated SQL and apply it to the intended PostgreSQL database using your database provider's migration workflow before deploying code that depends on it. Do not run unreviewed migrations against production.

## Project layout

- `db/schema.ts` — database tables
- `supabase/migrations/` — generated SQL migrations
- `src/data/` — recipe, challenge, level and badge data
- `src/server/auth.server.ts` — account and session handling
- `src/server/kitchen.server.ts` — cooking logs, XP, badges and leaderboards
- `src/server/kitchen.functions.ts` — server-function API used by routes
- `src/server/storage.server.ts` — private challenge-photo storage via Supabase Storage
- `src/server/recipes.server.ts` — recipes, favorites and meal planning
- `src/lib/img.ts` — provider-neutral static recipe-image URLs
