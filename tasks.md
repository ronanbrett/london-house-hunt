# London House-Hunt — Task Breakdown

Derived from the approved plan (`~/.claude/plans/…buzzing-bear.md`). Tasks are sized to be
individually shippable. Work phases top-to-bottom; within a phase, top-to-bottom.

**Legend:** `[ ]` todo · `[~]` in progress · `[x]` done
**Stack:** Nuxt 4 + Nitro · Nuxt UI v4 · Drizzle + libsql (SQLite) · Zod · Pinia · MapLibre · Vitest

> **Testing rule (applies to every task):** ship tests with the feature — server logic → Vitest
> unit tests; Vue components/pages → component test via `@nuxt/test-utils` (`mountSuspended`); API
> routes → a handler test; always cover one non-happy path. `npm test` must be green before a box
> is ticked. Details in `IMPLEMENTATION.md` → "Testing strategy".

---

## Phase 0 — Skeleton  _(foundation)_

- [x] **T0.1** Scaffold project — `package.json`, `nuxt.config.ts` (modules: `@nuxt/ui`,
  `@pinia/nuxt`; `runtimeConfig` for EPC/TfL/MapTiler keys + `dbUrl`), `tsconfig.json`,
  `.gitignore`, `.env.example`, `app/assets/css/main.css`, `app/app.vue`, default layout +
  nav, dashboard placeholder page. Deps installed.
- [x] **T0.2** DB client + Drizzle config — `server/db/client.ts` (`useDb()`, libsql via
  `NUXT_DB_URL`, FKs enabled); auto-import shim `server/utils/db.ts`; `drizzle.config.ts` confirmed.
- [x] **T0.3** DB schema — `server/db/schema.ts`: tables `properties`, `property_media`,
  `nearest_stations`, `enrichment_snapshots`, `destinations`, `commute_results`, `profiles`,
  `profile_weights`, `comparables`, `rent_estimates`, `scores`, `tags`, `property_tags`,
  `notes`, `app_meta`. Money = integer pounds. Index `(property_id, source, fetched_at)` on
  snapshots. _Done when:_ `npm run db:generate` emits a migration.
- [x] **T0.4** Run first migration — `0000_blushing_romulus.sql` applied; all 15 tables exist in
  `data/app.db` (verified via sqlite_master query).
- [x] **T0.5** Canonical shared types — `shared/types/canonical.ts`: Zod `CanonicalListing`
  (price, address, postcode, lat/lng, beds, baths, sqft, type, tenure, leaseYears,
  serviceCharge, groundRent, EPC, description, agent, photos[], floorplans[], stations[],
  sourceUrl, source), plus `EnrichmentSnapshot`, `Score`, `Verdict` enums. Reused everywhere.
- [x] **T0.6** Boot check — `npm run dev` serves the dashboard (HTTP 200, nav + empty state
  render). Installed `@iconify-json/lucide` for offline icons. Route warnings for
  /import,/compare,/settings are expected (pages land in Phase 1).
- [x] **T0.7** Test harness — `vitest.config.ts` (node default + `nuxt` env opt-in via
  `// @vitest-environment nuxt`); installed `@vue/test-utils` + `happy-dom` + `@testing-library/vue`.
  Smoke tests: `tests/unit/canonical.spec.ts` + `tests/components/dashboard.nuxt.spec.ts`
  (`mountSuspended`). `npm test` green (5 tests). Enforces the Testing rule above.

## Phase 1 — Import + view  _(MVP)_

- [x] **T1.1** Import detection + canonical mapper — `detect.ts` (portal + listing-id),
  `extract.ts` (brace-matching `extractAssignedObject` + `extractNextData`), `helpers.ts`
  (parseMoney/normalizeTenure/stripHtml/sqft), `errors.ts` (`ImportParseError`). Tested.
- [x] **T1.2** Rightmove parser — `rightmove.ts`: `mapRightmoveModel` (shared by fetch +
  bookmarklet) + `parseRightmoveHtml` (extracts `PAGE_MODEL`), Zod-validated, defensive. Tested
  with synthetic fixture (real-page fixture → X2).
- [x] **T1.3** Zoopla parser — `zoopla.ts`: `mapZooplaData` (defensive deep-find of the listing
  node in `__NEXT_DATA__`) + `parseZooplaHtml`. Tested w/ synthetic fixture. **Best-effort —
  needs validation against a real saved page (X2).**
- [x] **T1.4** Page fetcher — `fetchPage.ts`: GET with realistic UA, timeout, `p-retry` (3 tries).
  Tested with mocked fetch.
- [x] **T1.5** Paste-text parser — `parseText.ts`: `parsePastedText` extracts price/beds/baths/
  receptions/sqft(+sqm→sqft)/postcode/tenure/lease-years from pasted text. No network. Tested.
- [x] **T1.6** Persist helper — `persist.ts`: injectable-`db` upsert of a `CanonicalListing`
  (+ media, stations), derives sector/district, backfills lat/lng via postcodes.io, dedupes on
  sourceUrl (re-import updates in place). Tested against in-memory DB.
- [x] **T1.7** API: server-fetch import — `properties/import.post.ts`: detect → fetch → parse →
  persist; clear 400/502/422 errors steering to bookmarklet/manual.
- [x] **T1.8** API: bookmarklet import — `properties/import-bookmarklet.ts` (no method suffix so it
  answers the CORS preflight): accepts raw `PAGE_MODEL`/`__NEXT_DATA__`, same mapper+persist.
- [x] **T1.9** API: manual import — `properties/manual.post.ts`: validates a `CanonicalListing`
  (`source: manual`) → persist. Verified end-to-end via curl.
- [x] **T1.10** Bookmarklet asset + install page — `public/bookmarklet.js` (reference) + `/import`
  bookmarklet tab renders a draggable `javascript:` link built from `appBaseUrl`.
- [x] **T1.11** API: list/get/delete — `index.get.ts`, `[id].get.ts`, `[id].delete.ts` via
  `services/properties/repo.ts` (list w/ thumbnail; bundle = property+media+stations+notes). Tested.
- [x] **T1.12** Import page UI — `app/pages/import.vue`: three modes (URL · bookmarklet ·
  manual+paste-text with "extract fields"). Component test + manual verify.
- [x] **T1.13** Geo lookup — `postcode.ts` normalize/derive/lookup; backfill wired into persist
  (verified live: postcodes.io filled lat/lng + sector/district). Snapshot caching deferred to P2.
- [x] **T1.14** Dashboard list — `app/pages/index.vue`: card grid (price, £/sqft, beds/baths,
  status badge, thumbnail) + empty state. Component test with mocked endpoint.
- [x] **T1.15** Property detail — `app/pages/properties/[id].vue`: facts grid, photo gallery,
  client-only MapLibre pin (OSM tiles), stations, notes (add), status select, delete. Component test.
- [~] **T1.16** Notes + status APIs DONE (`[id]/notes.post.ts`, `[id]/status.patch.ts`, in repo,
  tested + curl-verified). **Tags UI/endpoints still TODO** (schema exists). _MVP deliverable met:
  add a property 3 ways + view it._

## Phase 2 — Enrichment + cache

- [x] **T2.1** Cache layer — `server/cache/snapshot.ts` `getOrFetch` (append-only snapshots, TTL,
  cacheKey-aware fresh/cached, stale-on-error fallback, no_match caching) + `ttl.ts`. Tested (in-mem DB).
- [x] **T2.2** HTTP utils — `server/services/enrich/http.ts`: `rateLimit` (per-host min-gap) +
  `fetchJson` (timeout + `p-retry`, throws on non-2xx). Tested with mocked fetch.
- [x] **T2.3** Enricher interface + orchestrator — `enrich/types.ts` (`Enricher`, `EnrichContext`,
  `geoKey`); `enrich/index.ts` registry + `enrichProperty` (parallel, per-source status) +
  `getLatestEnrichment`; routes `[id]/enrich.post.ts` & `[id]/enrichment.get.ts`. Tested.
- [x] **T2.4** Crime — `enrich/police.ts` (police.uk by lat/lng, keyless; `deriveCrime` → total +
  category breakdown). Tested + verified live (1,954 crimes for SE1 2UP). Rate-per-1000 needs ONS (T2.9).
- [x] **T2.5** Flood risk — `enrich/flood.ts` (EA flood-monitoring `floodAreas` within 2km, keyless;
  `deriveFlood`). Tested + verified live (15 areas near Tower Bridge).
- [ ] **T2.6** EPC — `enrich/epc.ts` (epc.opendatacommunities.org; capture UPRN + floor area —
  also feeds the value engine). **Needs API key** (key-gated skip when absent). TODO.
- [ ] **T2.7** Commute + destinations — `enrich/tfl.ts` (TfL journey planner); `destinations` CRUD +
  `settings/destinations.vue`; importance-weighted blend. **Needs TfL key.** TODO.
- [ ] **T2.8** Schools — `enrich/schools.ts` (nearest Ofsted-rated, distance-weighted). TODO.
- [ ] **T2.9** ONS area stats — `enrich/ons.ts` (population for crime-rate, tenure mix, area trend). TODO.
- [ ] **T2.10** Council tax + broadband — `councilTax.ts` (VOA band), `broadband.ts` (Ofcom). TODO.
- [~] **T2.11** Enrichment panels UI — `enrichment/{EnrichmentStatus,CrimePanel,FloodPanel}.vue` +
  detail-page "Area insights" section w/ Refresh + freshness badges. DONE for crime+flood;
  remaining panels land with their enrichers.

## Phase 3 — Value / comparables

- [ ] **T3.1** Land Registry comps — `server/services/value/comparables.ts`: SPARQL by postcode
  → sector → district until ≥8 sales ≤24m; filter by type/tenure.
- [ ] **T3.2** HPI time-adjustment — index historical sales to today via local-authority HPI.
- [ ] **T3.3** EPC↔PPD join — `server/services/geo/match.ts`: normalize addresses, join on
  postcode+house number, derive £/sqft comps; whole-price fallback (flagged).
- [ ] **T3.4** Verdict — `server/services/value/verdict.ts`: fair value + IQR, `deltaPct` →
  band, augment with price-history/time-on-market; emit `value_score` + rationale.
- [ ] **T3.5** Value API + UI — `server/api/value/[id].get.ts`; `app/components/value/`
  (ValueVerdict, ComparablesScatter, PriceHistoryChart). Add `@unovis/vue`.

## Phase 4 — Scoring + comparison

- [ ] **T4.1** Metric registry — `server/services/scoring/metrics.ts`: declarative metrics
  (key, category, direction, extract, normalize strategy, defaultWeight, missingPolicy).
- [ ] **T4.2** Normalizers — `server/services/scoring/normalize.ts`: linear/anchored, mapped,
  threshold/banded, logistic, relative; leasehold `leaseFactor` cliff.
- [ ] **T4.3** Score engine — `server/services/scoring/score.ts`: weighted blend, missing-data
  renormalization, confidence, `contributions[]`. Unit-tested with synthetic bundles.
- [ ] **T4.4** Profiles — `profiles`/`profile_weights` APIs; `settings/profiles.vue` weight
  editor; ship a default "Home to live in" profile.
- [ ] **T4.5** Per-property score — `server/api/properties/[id]/score.get.ts`; ScoreGauge +
  ScoreBreakdown on the detail page.
- [ ] **T4.6** Compare — `server/api/compare.post.ts` (cohort-aware matrix, best-in-row);
  `app/pages/compare.vue` + `app/stores/comparison.ts`; absolute/relative toggle.

## Phase 5 — Investment / yield  _(optional)_

- [ ] **T5.1** Rent estimate — `server/services/yield/estimate.ts`: VOA/ONS PRMS by beds+area →
  LHA floor → user override; store `rent_estimates` with source.
- [ ] **T5.2** Yield calc — gross + net (voids, mgmt, maintenance, service charge, ground rent).
- [ ] **T5.3** Growth + score — HPI CAGR context; `investment_score`; "Buy-to-let" profile.
- [ ] **T5.4** Yield API + UI — `server/api/yield/[id].get.ts` + detail-page panel.

## Phase 6 — Polish  _(optional)_

- [ ] **T6.1** Export/print comparison.
- [ ] **T6.2** Score-history charts (snapshots are append-only).
- [ ] **T6.3** Bulk re-enrich / refresh-all.
- [ ] **T6.4** Auth + runtimeConfig seam for later hosted deploy.

---

## Cross-cutting

- [ ] **X1** API keys: obtain free EPC (email+key) and TfL app key; MapTiler optional. Put in `.env`.
- [ ] **X2** Test fixtures: save sample Rightmove/Zoopla HTML + recorded API responses under
  `tests/fixtures/` for deterministic unit tests.
- [ ] **X3** README: setup, keys, how the three import paths + bookmarklet work, ToS note.
