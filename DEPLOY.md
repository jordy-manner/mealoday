# Vercel Deployment

Stack: Next.js 16 · Prisma 7 · Neon (Postgres) · Vercel hosting.

Deployment uses **Vercel's native Git integration**:

- push to **`main`** → **Production** deployment
- push to any other branch (e.g. `v0.1`) → **Preview** deployment (per-branch/PR URL)

## What the codebase already handles

- `postinstall: prisma generate` → the Prisma client (gitignored) is regenerated on every install.
- `vercel-build: prisma migrate deploy && next build` → Vercel applies **migrations** then builds. (Local `build` stays `next build`, unaffected.)
- `dotenv` is a direct dependency (required by `prisma.config.ts` at build time).
- `APP_RELEASE` is in the committed `.env` (= current tag) → displayed in the footer, nothing to configure.

## Environment variables to set in Vercel

In **Project → Settings → Environment Variables**, define `DATABASE_URL` **per environment**:

| Vercel environment | `DATABASE_URL` = connection string for… |
| --- | --- |
| **Production** | Neon **production** branch (host `ep-fancy-dream-…`) |
| **Preview** | Neon **development** branch (host `ep-empty-cake-…`) |

> Grab the strings (pooled) from the Neon dashboard → Branches → Connection string.
> **Never commit them** — they live only in Vercel (prod/preview) and `.env.local` (local).
> Previews hit the dev database; production hits the prod database.

## Connecting the repo (one-time manual step)

1. [vercel.com](https://vercel.com) → **Add New… → Project → Import Git Repository**.
2. Select **`jordy-manner/recipe-manager`** (grant GitHub access if prompted).
3. Framework detected: **Next.js** (leave defaults — `vercel-build` is picked up automatically).
4. Add the environment variables above (at minimum `DATABASE_URL` for Production and Preview).
5. **Deploy**.

## Maintenance mode ("Under construction")

`proxy.ts` (replaces Next 16 middleware) guards the site: when **`APP_MAINTENANCE="true"`**, every request returns a **503** with an "Under construction" page (`noindex`, not indexed by Google).

**Put PROD in maintenance** (while the app isn't ready) — in Vercel, **Production** environment only:

| Variable | Value |
| --- | --- |
| `APP_MAINTENANCE` | `true` |
| `APP_MAINTENANCE_BYPASS` | a secret of your choice (e.g. random string) |

Then **redeploy**. *(The proxy runs in Node.js runtime — env is read at runtime — but Vercel binds env variables to a given deployment, so a change only takes effect after a new deploy.)* `APP_MAINTENANCE` accepts `true`, `1`, `on`, `yes` (case/whitespace insensitive).

- **Do not** set `APP_MAINTENANCE` in **Preview** → staging stays open for development.
- **Owner bypass**: visit `https://meal.presstify.com/?unlock=<APP_MAINTENANCE_BYPASS>` → sets a cookie → you see the real site despite maintenance mode.
- **Lift maintenance** at launch: set `APP_MAINTENANCE=false` (or delete the variable) in Production → redeploy.

## Database

- The **production** branch already has the full schema (4 migrations) + the 12 seed units (it was the original database before the dev/prod split). `prisma migrate deploy` at build time is **idempotent**.
- To (re)seed units on a given database: `DATABASE_URL=<string> npm run seed`.

## After the first deployment

- Check the site footer: `© <year> — Release: vX.Y.Z` (value of `APP_RELEASE`).
- On every merge to `main`, Vercel redeploys production and applies any pending migrations.
