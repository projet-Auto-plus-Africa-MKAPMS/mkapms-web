---
name: testing-seo-os
description: Test the SEO OS end-to-end — control center page generation, visitor rendering of programmatic pages, sitemap, and IndexNow state. Use when verifying SEO OS UI, page generation, or indexing changes.
---

# Testing the SEO OS

Covers the PDG SEO control center (`/superadmin/admin-s-e-o`), programmatic page
rendering (`/service/:slug`, `/service/:slug/:ville`, `/piece/:slug`,
`/location/:slug`, `/marque/:marque`, `/marque/:marque/:modele`, `/ville/:slug`,
`/pays/:slug`), the sitemap (`/sitemap.xml`), and IndexNow submission state.

## Devin Secrets Needed
- None required for local testing. `INDEXNOW_KEY` is optional — without it the
  IndexNow submit button is (correctly) disabled and shows "non configuré".

## Local run (fastest reliable path)
1. Start Postgres (a docker container works). Example used before:
   `docker start mka-seo-pg` → `postgres://postgres:test@localhost:55433/<db>`.
2. **Create a FRESH db and sync the full schema with `db:push`, NOT `db:migrate`.**
   The migration journal is incomplete, and `server/seed.ts` references tables
   (e.g. `review_univers_registry`) that only exist via the drizzle schema:
   ```
   export DATABASE_URL=postgres://postgres:test@localhost:55433/mkafull
   npx drizzle-kit push --force
   ```
   Note: `drizzle.config.ts` only points at `server/schema.ts`; tables defined in
   `server/modules/*.ts` that are NOT re-exported there (e.g. `reviews.ts`) won't be
   created. The app still boots — those routers just error if called. SEO doesn't need them.
3. The full `npm run seed` may fail on `review_univers_registry` (non-fatal, unrelated
   to SEO). Instead insert only what SEO needs directly: a `super_admin` user +
   a few `annonces` with `status:"publiee"` (marque/modele/ville set) + one
   `garages_publics` row with `status:"valide"`. Users table requires `name`
   (not null) in addition to firstName/lastName.
4. Start server + client:
   ```
   DATABASE_URL=... JWT_SECRET=test-secret PORT=8080 PUBLIC_URL=http://localhost:5173 npx tsx server/index.ts
   npx vite --host --port 5173
   ```
   Vite proxies `/api` → `:8080`.

## PDG login
- Route is **`/mk-direction`** (hidden), NOT `/acces-pdg`.
- Default seed creds: `mka.garageauto@gmail.com` / `ChangeMoi2025!`.
- After login you land on `/superadmin`.

## Test flow
1. `/superadmin/admin-s-e-o` → verify real stat numbers (not the old fake "4 521"),
   click "Générer / mettre à jour les pages" → expect green message with per-type
   counts (services/pièces/locations/pays/marques/modèles/villes) and a
   "Répartition des pages" breakdown.
2. Open a generated page e.g. `/service/controle-technique` → expect `h1`,
   description paragraph, keyword chips, breadcrumb, internal links, and the browser
   tab title updated (set client-side by `MetaSEO`).
3. `/marque/<brand>` (a brand with a published annonce) → real brand page, must NOT
   fall through to NotFound / geo route.
4. IndexNow section → without `INDEXNOW_KEY` it must say "non configuré" and the
   submit button must be disabled (no false indexing promise).

## Gotchas
- A "hors de France (US)" popup and an install/PWA popup appear on navigation —
  dismiss with "Rester ici" / the ✕ before recording or clicking behind them.
- In dev (Vite) the server-side SSR meta injection does NOT run — title/meta come
  from client `MetaSEO`. To verify true SSR (robots see meta before JS), curl the
  built server (`npm run build && npm start`) instead. Might be needed for #106/#107.
- Generation is idempotent: re-running "Générer" keeps totals stable (upsert on slug).
