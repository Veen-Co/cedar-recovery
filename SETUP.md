# Setup

This repo is a template — use GitHub's "Use this template" feature to start a fresh, historyless repo per new blog/content-site project, rather than adding a second site into this same repo. This doc covers: starting a new project from the template, local dev, deploying to Vercel, and the non-obvious gotchas this stack has actually hit.

**One-time setup on this repo**: GitHub Settings → General → check "Template repository". That enables the "Use this template" button on the repo's main page (and `gh repo create --template <owner>/<repo>` from the CLI) — it generates a brand-new repo with this one's current file contents but no shared git history, which is cleaner than cloning and repointing `origin` by hand.

## Stack

- `apps/cms` — Payload 3, installed into a Next.js app (admin + REST API only)
- `apps/web` — Astro, static output, Tailwind v4
- `packages/types` — Payload's generated types, committed, imported by `apps/web`
- Postgres + S3-compatible object storage via [Neon](https://neon.com) (serverless, branchable — not a local Docker container)

## Starting a new project from the template

1. **Generate the new repo**: on GitHub, "Use this template" → "Create a new repository" (or `gh repo create <new-name> --template <owner>/<repo> --clone`). This is the new project's own repo from commit one — no shared history with this template repo, no `origin` to repoint.
2. **New Neon project** — see "Neon setup" below. Each new project needs its own; the connection string and bucket are per-project, never shared with the template or other instances.
3. **Rotate `PAYLOAD_SECRET`** — generate a fresh one (e.g. `openssl rand -base64 32`), don't carry it over between projects.
4. **Rename the root `package.json`'s `"name"`** and `apps/cms`/`apps/web`'s package names if you want them to reflect the new project instead of `cms`/`web`.
5. **Decide on `Home`**: it's a Payload Global by design (see "Home: Global vs. Pages doc" below) — if this project's homepage genuinely never needs content beyond the shared block library, you can simplify it to a `Pages` document with a reserved slug (`home`) instead. Only worth doing if you're sure; switching back later means re-authoring content.
6. **Empty content**: `Categories` and `Media` start empty for a new project — nothing to migrate.

## Neon setup

A dev branch can't live *in* the template — it's tied to each clone's own Neon project/org. This is the recipe, including the gotchas this session actually hit.

**If your Neon account spans multiple orgs** (e.g. a personal account and a work/sandbox org), `neon login` scopes the CLI to whichever org it defaults to — `neon link` can silently land on the wrong org's default project if you don't pass `--org-id` explicitly. To use a different account/org than what's already logged in:

```bash
neon profile create personal   # opens a browser OAuth flow for that account
neon me --profile personal     # verify which account actually landed
neon orgs list --profile personal
```

Then link and check out the branch — **from inside `apps/cms`**, since that's where `.env.local` needs to land:

```bash
cd apps/cms
neon link --profile personal --org-id <org-id> --project-id <project-id> --branch production -y
neon checkout production --profile personal
```

`neon checkout` is the step that actually pulls `DATABASE_URL` into `.env.local` — `neon link` alone only writes the `.neon` context file, not the connection string. Skipping `checkout` is the most common way to end up with a project linked but no working `DATABASE_URL`.

**Recommended default for a new project**: create a `development` branch for local work instead of connecting directly to `production` (`neon branches create --name development`, then `checkout development` instead of `production`) — keeps local schema churn off the branch that eventually serves real traffic. *This instance* connects local dev straight to `production` as a deliberate exception (accepted early on, since the project had no real traffic yet) — not the general recommendation.

**Object storage**: the bucket name is *not* an environment variable — `neon checkout`/`neon deploy` inject `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_ENDPOINT_URL_S3`, `AWS_REGION` into `.env.local`, but the bucket name itself is a literal string in `apps/cms/src/payload.config.ts`'s `s3Storage()` call. Find it with:

```bash
neon buckets list --profile personal --project-id <project-id>
```

Neon Object Storage is S3-compatible but not literally AWS — it needs `forcePathStyle: true` and `requestChecksumCalculation: 'WHEN_REQUIRED'` in the S3 client config (already set in `payload.config.ts`).

## Local dev

```bash
pnpm install
pnpm dev
```

Runs both apps concurrently via Turborepo. `apps/cms` → `http://localhost:3000/admin`, `apps/web` → `http://localhost:4321`.

## Schema changes & migrations

`push: false` is set in `payload.config.ts` — Payload explicitly warns against mixing push-mode auto-sync and migrations against the same database, so this project committed fully to migrations, including for local dev (not just production). After editing a collection/global's `fields`:

```bash
cd apps/cms          # not the root — see the Turborepo warning below
pnpm migrate:create  # generates a migration file from the config diff
pnpm migrate         # applies it to your local database
pnpm --filter cms generate:types
```

**Run these directly through `apps/cms`, not via the root `pnpm dev`/Turborepo.** `migrate:create` can prompt interactively (arrow keys + Enter) when it can't tell whether a schema change is a genuine rename or an unrelated create/drop — Turborepo's `pnpm dev` multiplexes and prefixes each package's log output, which breaks real TTY access, so the prompt appears to hang with no way to answer it. At that prompt: pick **create/delete**, never **rename**, unless you're certain the old and new fields are genuinely the same data reshaped (in practice, across this project's schema changes so far, they never have been — different storage shapes across a restructure, even when a field's *name* stayed similar).

**Adopting migrations on a database that already has the schema** (from this project's earlier push-mode history, or if a teammate ever does local push-mode work before syncing to migrations): `migrate:create` will happily generate a migration full of `CREATE TABLE`/`CREATE TYPE` statements for things that already exist, and running it fails with `type "..." already exists`. That migration file's content is still correct and valuable — it's exactly what a *fresh* database (a new clone, CI, a new environment) needs to run. The fix for your *own* already-migrated database is to mark that one migration as applied without executing its SQL, e.g.:

```sql
insert into payload_migrations (name, batch) values ('<migration-file-name>', 1);
```

(No `psql` needed — a short Node script using the `pg` package already in the dependency tree works fine; see `apps/cms/src/migrations/` for the actual filename.) Verify with `pnpm migrate:status` — it should show the migration as `Ran: Yes`.

## Type checking

```bash
pnpm --filter web check
```

**`typescript` must stay pinned to `^6.0.3`, not the latest `7.x`.** TypeScript 7's new native compiler doesn't yet expose the Language Service API that `astro check` (via `@astrojs/language-server`) depends on — `astro check` fails outright on 7.x with an explicit error pointing this out. If a future `pnpm install` bumps `typescript` past 6.x and `check` starts failing, re-pin it.

## Frontend baseline: what's included, what's deliberately not

**Included** (genuinely opinion-free, every content site wants it):

- `src/layouts/Layout.astro` — universal `<html>` shell, SEO meta tags
- `src/layouts/PostLayout.astro` — wraps `Layout`, adds the two-column content+sidebar grid (the one structurally different shape — `Pages`/`Home` don't need a third layout)
- Three primitives (`Container`, `Button`, `Prose`) — the concretely-repeated needs across the block library, not a speculative larger set. Add a fourth only once real duplication shows up while building, not preemptively.
- Tailwind v4 (via `@tailwindcss/vite`, the current approach — the old `@astrojs/tailwind` integration is deprecated) + `@tailwindcss/typography`. This *was* planned as framework-agnostic plain CSS, reconsidered mid-build: baking in a CSS framework only "imposes an opinion on a future project" if that project's owner didn't already default to it — since Tailwind is the actual stated default here, and ripping Tailwind classes back out of real component code is roughly as much work as retrofitting plain CSS *to* Tailwind, there's no clearly safer neutral choice once real components exist.
- Design tokens live in `src/styles/global.css`'s `@theme` block (Tailwind v4's CSS-first config *is* the tokens mechanism — no separate `tokens.css`). Values there are neutral placeholders — swap them for your own brand.
- `@astrojs/sitemap` + a dynamic `src/pages/robots.txt.ts` (not a static `public/robots.txt`) that points at the sitemap using the same `site` config value — one source of truth for the domain rather than two files to keep in sync. **Requires `SITE_URL` to be set as a real environment variable at build time** (not a `.env` file — see the gotcha below) or the sitemap silently ships with the obviously-wrong `https://example.com` placeholder.

**Not included, by design**: a specific visual design/brand, any styling library beyond Tailwind+Typography, additional primitives beyond the starting three.

## Home: Global vs. Pages doc

`Home` is a Payload Global, not a `Pages` document with a reserved slug — decided deliberately. A Global gets its own independent field schema, so if the homepage ever needs content beyond the shared block library (home-exclusive block types, bespoke fields), those stay real CMS-editable fields. Folded into `Pages`, every document shares one schema — anything homepage-only would need hacky `admin.condition` tricks or end up hardcoded directly in `index.astro` instead of editable in `/admin`. Astro's per-route templating can render the same data differently, but it can't originate data a schema doesn't capture.

If a given project's homepage genuinely never diverges from the shared blocks, simplifying to a `Pages` doc with slug `home` is a reasonable trade for that project — see step 5 in "Starting a new project from the template."

## Media URLs

Payload's `Media.url` field is **relative** (e.g. `/api/media/file/x.jpg`) — meant to resolve against the CMS's own origin, not the Astro site's. Every place `apps/web` renders a `Media` object's `url` goes through `resolveMediaUrl()` in `src/lib/payload.ts`, which prefixes it with `PAYLOAD_URL`. Rendering `image.url` directly produces a broken image (the browser resolves it against the Astro site's own origin instead) — this bit us once already; use `resolveMediaUrl()` for any new component that renders an image.

## Images: required, optional, or unused is a per-component decision

Not a generic fallback chain on the data side. `post.meta?.image ?? post.hero?.image` is fine as "which of these two already-optional fields happens to be set" — but each specific component/variant decides whether it can render with no image at all (the default for most blocks) or whether an image is mandatory for that particular design (`Hero`'s `imageForward` variant, e.g.).

## Rebuild-on-publish

`apps/cms/src/hooks/triggerDeploy.ts` — `afterChange`/`afterDelete` hooks on `Posts`, `Pages`, `Categories`, and the `Home` global POST to `DEPLOY_HOOK_URL` (a Vercel Deploy Hook for `apps/web`, set up below) whenever content is published or deleted. Silently no-ops if `DEPLOY_HOOK_URL` is unset (normal for local dev) — logs `[triggerDeploy] DEPLOY_HOOK_URL not set — skipping` either way, so the wiring is verifiable without a real deploy hook to point at. Known tradeoff: rapid successive edits fire multiple rebuilds — fine for a low-traffic site, a debounce/queue is a future refinement if it ever matters.

## Deploying to Vercel

This template repo itself isn't meant to be directly hosted — this is the recipe a clone follows. Two separate Vercel projects, deployed in this order:

1. **`apps/cms`**: New Vercel project, **Root Directory = `apps/cms`**. Environment variables: `DATABASE_URL` (production Neon branch — not the local dev branch), `PAYLOAD_SECRET`, `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`/`AWS_ENDPOINT_URL_S3`/`AWS_REGION` (production bucket credentials), `DEPLOY_HOOK_URL` (leave unset for the first deploy — set it after step 3). Deploy, note the resulting production URL.
2. **`apps/web`**: New Vercel project, **Root Directory = `apps/web`**. Environment variable: `PAYLOAD_URL` set to `apps/cms`'s production URL from step 1. Astro's static output (`output: 'static'`, the default — no SSR adapter) should deploy on Vercel's zero-config static/Astro detection. Deploy.
3. In the `apps/web` Vercel project, create a **Deploy Hook** (Settings → Git → Deploy Hooks). Copy its URL into `apps/cms`'s `DEPLOY_HOOK_URL` environment variable and redeploy `apps/cms`.

**Production migrations are automated.** `apps/cms`'s `build` script runs `payload migrate && next build` — Vercel's build step applies any pending migrations before building, so a production deploy never depends on push mode (which is disabled anyway — see "Schema changes & migrations" above). Just make sure every schema change went through `migrate:create` locally and the resulting migration file is committed before deploying — a schema change made only via editing config, without generating its migration, won't apply in production.

## Known gotchas (verbatim, so they don't get rediscovered)

- **CLI scaffolds land in the wrong place.** Both `create-payload-app` and `create-astro` have scaffolded with hyphenated package names (`apps-cms` instead of `cms`) and, once, wrote the directory itself as a root-level sibling instead of nested under `apps/`. Verify the actual output location and `package.json` `name` field after scaffolding; fix by hand if needed.
- **`pnpm dlx` + build scripts**: `ERR_PNPM_IGNORED_BUILDS` inside a `dlx` context can't be fixed with `pnpm approve-builds` (a known pnpm bug — `dlx` runs in an isolated store `approve-builds` can't reach). Use `pnpm dlx --allow-build <package> <command>` instead.
- **`payload migrate:create --force-accept-warning` does not generate an empty/no-op migration** — despite what at least one third-party guide claims. It generates the full real migration (all pending `CREATE TABLE`/`CREATE TYPE` statements) and just suppresses an interactive warning prompt. See "Adopting migrations on a database that already has the schema" above for the actual way to baseline an already-migrated database.
- **A dependency needed by only one workspace package can still fail to resolve** if pnpm decides it needs a separate "peerless" build for a package lacking the peer deps present elsewhere in the workspace, and that variant never gets materialized (dangling symlink, "Cannot find module"). If adding matching peer deps doesn't fix it, don't keep fighting pnpm's resolution — write the smaller amount of code yourself instead of pulling in a heavy dependency chain for one utility function (this is why `apps/web/src/lib/lexicalToHtml.ts` is a small hand-written Lexical-to-HTML walker instead of using `@payloadcms/richtext-lexical`'s official `convertLexicalToHTML` — that import pulled in a hard `react`/`react-dom`/`payload`/`@payloadcms/next` peer chain that never resolved correctly for a plain Astro app with no React anywhere in it).
- **`astro.config.mjs` can't use `import.meta.env`, and can't reliably import `vite` either.** Astro evaluates the config file before loading `.env` files (so `import.meta.env.X` is always undefined there), and Astro's config loader runs the file through its own isolated Vite module-runner where even directly importing `vite` (e.g. for its `loadEnv` helper) fails to resolve, despite being a real listed dependency. Plain `process.env.X` is the only thing that reliably works in `astro.config.mjs` — which is fine for values a real deploy sets as actual env vars (Vercel does), just not for local `.env`-file convenience.
