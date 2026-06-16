# London House-Hunt

A personal, **local-first** web app for house-hunting in London. Save a property, auto-enrich it
with free official UK data, judge whether it's good value, score it against what matters to you,
and compare candidates side-by-side.

Built with Nuxt 4 + Nitro · Nuxt UI · Drizzle + libsql (SQLite) · Zod · Pinia · MapLibre · Vitest.

## What it does

- **Add a property three ways** — paste a Rightmove/Zoopla link (server fetch + parse), a **browser
  bookmarklet** (reads the listing already loaded in your browser — most robust, no extra request to
  the portal), or **manual / paste-text** entry. All become one canonical record, auto-geocoded.
- **Auto-enrich** (one click, cached locally) — nearby **stations + distances** (TfL), **commute**
  to destinations you define (TfL journey planner), **crime** (police.uk), **flood risk**
  (Environment Agency), and **EPC** (rating + floor area, needs a free key). Council-tax band comes
  from the listing.
- **Is it good value?** — fair-value estimate + over/under-priced **verdict** from recent HM Land
  Registry sold comparables nearby.
- **Score every property** — a tunable 0–100 score with a confidence indicator and per-metric
  breakdown (value, commute, station proximity, safety, flood, EPC, tenure, size). Tune the weights
  at `/settings/profiles`.
- **Compare** — side-by-side matrix across every metric with the winner highlighted per row.
- **Investment / yield** — enter an expected rent → gross/net yield (incl. service charge + ground
  rent); optional `investment` score you can weight up for buy-to-let.

## Getting started

```bash
npm install
npm run db:migrate        # creates data/app.db (gitignored)
npm run dev               # http://localhost:3000
```

Other scripts: `npm test` (Vitest), `npx nuxi typecheck`, `npm run db:generate` (after editing
`server/db/schema.ts`), `npm run db:studio`.

## Configuration (`.env`) — all optional, all free

Copy `.env.example` to `.env`. Everything works without keys except where noted:

| Key | Unlocks | Without it |
|---|---|---|
| `NUXT_EPC_API_EMAIL` + `NUXT_EPC_API_KEY` | EPC rating + floor area ([register free](https://epc.opendatacommunities.org/)) | EPC panel shows "no match"; whole-price value only |
| `NUXT_TFL_APP_KEY` | Higher TfL rate limits ([register free](https://api-portal.tfl.gov.uk/)) | Stations + commute still work anonymously |
| `NUXT_PUBLIC_MAPTILER_KEY` | (reserved) vector map tiles | Map uses keyless OpenStreetMap raster tiles |

Stations, commute, crime, flood, sold prices, and geocoding are all **keyless**.

## Data sources (all free / official)

police.uk · Environment Agency flood-monitoring · TfL Unified API (StopPoint + Journey) ·
HM Land Registry Price Paid (SPARQL) · postcodes.io · EPC Open Data Communities.

## How the bookmarklet works

On the **Add property → Bookmarklet** tab, drag the button to your bookmarks bar. While viewing any
Rightmove/Zoopla listing, click it — it reads the listing data already in the page and posts it to
your local app. No scraping happens server-side, and it uses your own browser session.

## Honest limitations

- **Rent** is user-entered (no free per-address rent API exists; VOA/ONS are bulk datasets).
- **Value** is a whole-price comparison, not £/sqft, until an EPC key is set (then comps can be
  joined to floor areas). Sold prices are **not yet HPI time-adjusted**.
- **Schools/Ofsted** and **broadband** have no free point-API (GIAS dropped Ofsted ratings in 2024;
  Ofcom is bulk-only), so they're not included (broadband is a stretch goal).
- Crime is a raw count near the point (no per-capita normalisation), so dense central areas score low.
- Importing from a portal URL is a personal-use convenience and a ToS grey area — prefer the
  bookmarklet or manual entry. Parsers degrade gracefully to manual on failure.

## Project layout & working docs

- `app/` — Nuxt pages, components, stores · `server/` — Nitro API routes + `services/` (testable
  business logic) + `db/` (Drizzle schema + migrations) · `shared/types/` — canonical Zod types ·
  `tests/` — Vitest unit + component tests.
- `tasks.md` — the build plan / task breakdown · `IMPLEMENTATION.md` — runbook + progress log ·
  `CLAUDE.md` — conventions + checkpoint routine.
