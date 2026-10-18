# Cloudflare Workers deployment checklist

COOKr uses TanStack Start server functions, so it must run on a server-capable host such as Cloudflare Workers. GitHub Pages can serve static files only and is not a production host for this app.

## 1. Prerequisites

- A Cloudflare account
- Node.js compatible with the Wrangler version in this project
- A PostgreSQL database (the codebase is currently configured for Supabase Postgres)
- A Supabase project if you want challenge-photo uploads to work
- A Nara API key if you want Dragy and macro-photo analysis to work

Run commands from the repository root, where `wrangler.jsonc` is located.

## 2. Install and authenticate

```powershell
npm install
npx wrangler login
```

Complete the browser login yourself and approve only the Cloudflare account access you intend to use.

## 3. Configure PostgreSQL with Hyperdrive

The current `wrangler.jsonc` contains a placeholder Hyperdrive ID. It must be replaced with the ID of a real Hyperdrive configuration before production deployment.

Create a Hyperdrive configuration using your database provider's PostgreSQL connection string. Keep the connection string private; never commit it or paste it into chat.

```powershell
npx wrangler hyperdrive create cookry-db --connection-string="YOUR_POSTGRES_CONNECTION_STRING" --update-config
```

Use the connection string provided by your database provider. If your provider offers separate pooled and direct connection strings, follow that provider's guidance for Cloudflare Hyperdrive. The command should print a Hyperdrive ID and update the Wrangler configuration; verify that `wrangler.jsonc` now contains a real ID rather than `REPLACE_WITH_YOUR_HYPERDRIVE_ID`.

The code expects the binding name `HYPERDRIVE`. Do not rename the binding without updating `db/index.ts` too.

## 4. Configure Worker secrets

Set secrets interactively so values are not committed to source control:

```powershell
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put NARA_API_KEY
```

The Supabase service-role key is highly privileged. Keep it server-side and never expose it in client-side code. The Nara key is optional if you do not need Dragy or macro-photo analysis yet.

For local development, use a local-only environment file supported by your chosen Vite/Cloudflare development workflow. Do not commit real values in `.env`, `.dev.vars`, or any other file.

## 5. Confirm database migrations

Before exposing the app publicly, confirm that all SQL migrations under `supabase/migrations/` have been reviewed and applied to the PostgreSQL database that Hyperdrive points to. Do not assume that creating a Hyperdrive binding creates the app's tables.

## 6. Build, preview, deploy

```powershell
npm run build
npx wrangler deploy
```

If the build fails, fix those errors before deploying. After deployment, Wrangler prints the Worker URL, usually ending in `.workers.dev`. Open that URL and test:

- Home page and recipe images
- Recipe discovery and filtering
- Sign-up, sign-in, and sign-out
- Meal planner and favorites
- Challenge entries and private photo uploads
- Dragy and macro analysis if the Nara secret is configured

Check runtime logs with:

```powershell
npx wrangler tail
```

## Current known blockers

- `wrangler.jsonc` currently contains `REPLACE_WITH_YOUR_HYPERDRIVE_ID`; deployment is not ready until this is replaced with a real Hyperdrive ID.
- The app needs its PostgreSQL schema/migrations applied to the database.
- Supabase Storage features need `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
- The existing image helper previously generated Netlify Image CDN URLs. Recipe photos should use their committed static paths on Cloudflare unless a Cloudflare-native image service is configured.

Do not claim deployment is complete until the build passes, Wrangler reports a successful deployment, and the deployed Worker URL has been tested.
