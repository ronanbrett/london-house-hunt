# Implementation Runbook & Scratchpad

This is the **working file** for executing the build in `tasks.md`. It tells an agent (or me, in a
fresh session) how to pick up the next task and finish it systematically, and it carries the
running state, decisions, and blockers so work can resume without re-reading everything.

> Read order at the start of any session: **this file's "Current state"** → `tasks.md` →
> the approved plan (`~/.claude/plans/…buzzing-bear.md`) only if deeper context is needed.

---

## How to use this file

1. Check **Current state** below to see where things stand.
2. Run the **Execution loop** for the next unchecked task in `tasks.md`.
3. Keep **Progress log**, **Decisions**, and **Blockers** updated as you go.
4. This file is a scratchpad — edit it freely. `tasks.md` is the source of truth for *what's left*;
   this file is *how* and *where we are*.

---

## Current state  _(update at the end of every working session)_

- **Phase:** 0 ✅, 1 ✅. **Phase 2 in progress** — cache + orchestrator + crime + flood + **stations** +
  **commute/destinations** + **EPC (key-gated)** done & live-verified. Remaining: schools/ONS/council-
  tax/broadband (dataset-based, no clean free API).
- **Done (P2 so far):** `cache/snapshot.ts` getOrFetch + `ttl.ts`; `enrich/http.ts` (rateLimit +
  fetchJson); `enrich/types.ts` + `enrich/index.ts` (registry, `enrichProperty`, `getLatestEnrichment`);
  enrichers: **police, flood, stations(transit), epc**; routes `[id]/enrich.post` (Refresh forces) +
  `[id]/enrichment.get`; detail-page "Area insights" with Stations/Crime/Flood/EPC panels.
  `npm test` = **63 across 22 files**; typecheck clean; live smoke (SW11 2QP → Clapham Junction 0.02mi,
  864 crimes, 16 flood areas, epc skipped) green.
- **Phase 2 complete (free-API scope).** User decisions: schools **dropped** (no free Ofsted data),
  ONS **dropped** (low value), council tax via import ✅, **broadband → Stretch goal S1** (wanted,
  needs Ofcom bulk ingestion; revisit after Phase 4).
- **Phase 3 done** (value verdict; T3.2 HPI-source + T3.3 £/sqft deferred). **Phase 4 in progress** —
  scoring engine + per-property score ✅ live-verified (SW11 1LE → 51, conf 0.85, 7 metrics).
  Done: T4.1 metrics, T4.2 normalizers, T4.3 score engine + inputs, T4.5 per-property score + ScorePanel.
- **Next task:** **T4.4 profiles** (profiles/profile_weights APIs + `settings/profiles.vue` weight
  editor; default "Home to live in"; thread profileId into score) → **T4.6 compare** (`compare.post.ts`
  cohort matrix + best-in-row, `compare.vue` + comparison store, absolute/relative). Then dashboard
  score badges. Also: T1.16 tags, X2 fixtures, T3.2 HPI source, T3.3 £/sqft.
- **Enricher recipe (follow for each new source):** add `enrich/<src>.ts` (export a pure `derive*`
  + an `Enricher` using `geoKey`/postcode for cacheKey, `fetchJson`, key-gated `no_match` when a
  required key is absent) → add to `ENRICHERS` in `enrich/index.ts` → add `enrichment/<Src>Panel.vue`
  → wire into the detail page → unit-test the `derive*` + a panel test. TTL lives in `cache/ttl.ts`.
- **Dev server:** running in background on :3000.
- **Testing harness:** Vitest 4; node-env unit tests + `nuxt`-env component tests (`mountSuspended`,
  `registerEndpoint`) both working. `#shared/*` resolves in tests.
- **Gotchas learned:** (1) component auto-import names are path-prefixed — `property/StatusBadge.vue`
  is `<PropertyStatusBadge>`. (2) Import `maplibre-gl` dynamically inside `onMounted` (its top-level
  code throws under the test DOM / SSR). (3) Nitro can infer a complex route return as `{}` — type
  the `useFetch` explicitly (see detail page `PropertyBundle`).
- **Env/keys:** none set yet (needed from Phase 2 onward).
- **Versions of note:** `@nuxt/ui` v4.8.2, `zod` v4.4.3, `drizzle-orm` 0.45, `vitest` 4.

---

## Execution loop  _(repeat per task)_

For each task `T#.#`, work through this checklist:

- [ ] **1. Select** the top unchecked task in `tasks.md` (respect phase + within-phase order;
  honor stated dependencies). Mark it `[~]` in `tasks.md` and note it under Current state.
- [ ] **2. Understand** — re-read the task line and the relevant plan section. If it touches
  existing code, read those files first. Reuse existing helpers/types — don't duplicate.
- [ ] **3. Design check** — if the task is ambiguous or has >1 reasonable approach that affects
  other tasks, note the choice under **Decisions** before coding (don't silently diverge from the plan).
- [ ] **4. Implement** — follow **Project conventions** below. Keep changes scoped to the task.
- [ ] **5. Validate at boundaries** — Zod-parse all external/user input and external API responses;
  money stays integer pounds; external calls go through the cache layer (from Phase 2).
- [ ] **6. Verify** — run the relevant checks in **Verification** (typecheck + unit test + manual
  where applicable). A task is not done if typecheck or tests fail.
- [ ] **7. Test (mandatory — every feature)** — no task is done without tests. See **Testing
  strategy** below. Minimum bar:
  - **Server logic** (parsers, scoring, value, geo, services): Vitest unit tests with fixtures.
  - **API routes**: a test hitting the handler (happy path + one failure/validation path).
  - **Vue components & pages**: a Vue component test (`@nuxt/test-utils` `mountSuspended` /
    `renderSuspended`) asserting render + key interaction/state — not just manual `npm run dev`.
  - Cover the realistic failure/empty/missing-data path, not only the happy path.
- [ ] **8. Record** — tick the task `[x]` in `tasks.md`; append a one-line **Progress log** entry;
  update **Current state** (Done / Next task); add any new follow-up tasks to `tasks.md`.
- [ ] **9. Checkpoint** — at a major checkpoint (phase done / significant feature done): ensure
  `npm test` + typecheck are green → run the **self-review loop (≤5 cycles)** to improve the diff →
  update `tasks.md` + this file → **commit and push** (durably authorized — see CLAUDE.md "Checkpoint
  routine"). Still pause for the user before a PR, deploy, destructive DB op, force-push, or a
  decision that contradicts the approved plan.

### Definition of done (every task)
- **Tests exist and pass for the feature** — server logic has unit tests; UI has Vue component
  tests; API routes have a handler test. `npm test` is green. A feature without tests is not done.
- Code typechecks; no new console errors in `npm run dev`.
- Input/output validated with Zod where data crosses a boundary.
- `tasks.md` checkbox ticked + Progress log entry written.

---

## Testing strategy  _(tests are part of every feature, not a later phase)_

Harness: **Vitest 4** + **@nuxt/test-utils** + **@vue/test-utils** (+ happy-dom). Config in
`vitest.config.ts`. Tests live in `tests/` (`tests/unit/`, `tests/components/`, `tests/server/`,
fixtures in `tests/fixtures/`).

| Layer | What to test | How |
|---|---|---|
| **Schemas/types** (`shared/`) | parse valid + reject invalid; defaults applied | Vitest, node env |
| **Import parsers** (`server/services/import/`) | portal JSON/HTML fixture → expected `CanonicalListing`; malformed input degrades (no throw, returns partial/typed error) | Vitest + saved fixtures |
| **Services** (scoring, value, geo, yield) | math/branches incl. missing-data, renormalization, edge bands | Vitest, node env, synthetic inputs |
| **API routes** (`server/api/`) | happy path + a validation/failure path | Vitest (call handler / `@nuxt/test-utils` request helpers) |
| **Vue components & pages** (`app/`) | renders expected content; empty/loading/error states; key user interaction emits/calls; conditional UI | `mountSuspended`/`renderSuspended`, file named `*.nuxt.spec.ts` with `// @vitest-environment nuxt` |

Conventions:
- Pure-logic tests: default `node` environment (fast). Component tests: add
  `// @vitest-environment nuxt` at the top of the file (gives auto-imports, Nuxt UI, NuxtLink).
- Name component/runtime tests `*.nuxt.spec.ts`; pure tests `*.spec.ts`.
- Every feature must test at least one **non-happy** path (empty/missing/invalid).
- Save real portal HTML + API responses under `tests/fixtures/` (task X2) so parser/enricher tests
  are deterministic and offline.
- Run `npm test` (CI-style, once) before marking a task done; `npm run test:watch` while iterating.

---

## Project conventions  _(the rules while coding)_

- **Layering:** business logic in `server/services/**` as plain TS (no `h3`/Nitro imports) so it's
  unit-testable. `server/api/**` routes are thin: validate → call service → return.
- **Shared types:** one canonical shape in `shared/types/canonical.ts`; all three import paths and
  the UI use it. Don't define parallel listing types.
- **Validation:** Zod at every boundary (import parse, API request/response, forms). Parse, don't
  assume. Use defensive optionals on scraped JSON so a portal change degrades gracefully.
- **Money:** integer **pounds** everywhere (price, rent, charges, comps). Documented once; never mix units.
- **External data:** every call to an external API goes through `server/cache/snapshot.ts`
  `getOrFetch` (Phase 2+) — never hit the network inline. Failures are per-source and non-fatal.
- **Address/area joins:** coordinate sources → lat/lng; area sources → LSOA/MSOA/LA codes
  (postcodes.io); property sources → postcode + normalized house number, capture UPRN, store
  `match_confidence`.
- **Scoring honesty:** always carry a `confidence` and per-metric `missingPolicy`; never fabricate
  a number you can't compute (prefer `exclude` + renormalize).
- **Naming/structure:** match existing file and component conventions in the repo as it grows.
- **Keys/secrets:** server-only via `runtimeConfig`; degrade gracefully when a key is absent.

---

## Verification  _(commands)_

| Check | Command | When |
|---|---|---|
| Dev server | `npm run dev` | manual UI/route checks |
| Unit tests | `npm run test` | after any parsing/scoring/value logic |
| Typecheck | `npx nuxi typecheck` _(add `vue-tsc`+`typescript` if missing — see X-tasks)_ | before marking done |
| Gen migration | `npm run db:generate` | after editing `server/db/schema.ts` |
| Apply migration | `npm run db:migrate` | after generating |
| Inspect DB | `npm run db:studio` | spot-check tables/rows |

Manual smoke for the MVP (Phase 1 deliverable): import the **same** listing via all three paths
→ identical canonical record; open detail page → facts/photos/map render.

---

## Progress log  _(append one line per task; newest at bottom)_

- 2026-06-16 — T0.1 done: scaffolded Nuxt 4 + Nuxt UI v4 + Pinia, runtimeConfig for keys, default
  layout/nav, dashboard placeholder; installed deps (802 pkgs).
- 2026-06-16 — T0.2 done: `useDb()` (libsql, FKs on) + `server/utils/db.ts` auto-import shim.
- 2026-06-16 — T0.3/T0.4 done: full schema (15 tables, money=integer pounds, append-only
  enrichment_snapshots w/ index); generated + applied `0000_blushing_romulus.sql`.
- 2026-06-16 — T0.5 done: canonical Zod schemas/types (CanonicalListing, Enrichment, Score, Verdict).
- 2026-06-16 — T0.6 done: dev server boots (HTTP 200, dashboard renders); added `@iconify-json/lucide`.
  Phase 0 complete.
- 2026-06-16 — T0.7 done: Vitest harness (node + nuxt envs); `@vue/test-utils`/`happy-dom`; smoke
  tests pass. Testing made a hard per-feature requirement in docs + CLAUDE.md created.
- 2026-06-16 — T1.1/T1.2/T1.3/T1.5 done: import parsers (detect, extract, helpers, Rightmove,
  Zoopla, paste-text) → CanonicalListing, all Zod-validated + unit-tested (29 tests green,
  typecheck clean). T1.13 geo helpers (normalize/derive/lookup) done; backfill wiring pending.
- 2026-06-16 — T1.4/T1.6–T1.16 done: fetchPage; persist (geo backfill + dedupe); API routes
  (import, bookmarklet+CORS, manual, list/get/delete, notes, status, parse-text); repo service;
  bookmarklet asset; dashboard, import, detail pages; client-only MapLibre map. 40 tests green
  (incl. in-memory-DB persist/repo + component tests), typecheck clean, end-to-end curl smoke green.
  Phase 1 MVP complete (tags UI deferred).
- 2026-06-16 — Phase 2 core: cache (`getOrFetch`/TTL), `fetchJson`/rateLimit, enricher
  registry+orchestrator, police + flood enrichers (keyless), enrich/enrichment routes, detail-page
  Area-insights panels. 54 tests green, typecheck clean, live-verified against police.uk + EA.
- 2026-06-16 — Phase 2 cont.: stations enricher (TfL StopPoint, keyless, new `transit` source) +
  EPC enricher (key-gated, address-match heuristic) + their panels. Self-review loop ran 2 cycles
  (cycle 1: Refresh now forces refetch; orchestrator test now covers transit+epc). 63 tests green,
  typecheck clean, live-verified (Clapham Junction 0.02mi, EPC skipped w/o key).
- 2026-06-16 — T2.7 commute + destinations: TfL Journey enricher (keyless, importance-weighted
  blend), destinations repo + CRUD routes + settings page (geocodes postcode), CommutePanel,
  destinations threaded through EnrichContext. 70 tests green, typecheck clean; live-verified
  (Clapham→Liverpool St 38 min). Self-review: code clean (1 effective cycle; a smoke-script
  noclobber bug was fixed, not app code).
- 2026-06-16 — Phase 2 closed (free-API scope). Schools/ONS dropped (user); broadband → Stretch S1;
  council tax via import. Phase 3 started — T3.1 Land Registry comps (`value/landRegistry.ts`) via
  SPARQL VALUES over postcodes.io-nearest postcodes. 73 tests green, typecheck clean; live-verified
  (37 real Clapham sales). Self-review 1 cycle (bad test postcode, not a code bug).
- 2026-06-16 — Phase 3 value engine: hpi.adjustToToday (source deferred), verdict (median/IQR/bands/
  valueScore), valueFromSales + computeValue (persists comparables), value API + ValueVerdict UI.
  87 tests green, typecheck clean; live-verified (SW11 1LE £600k → overpriced vs £417.5k). Self-review
  2 cycles (cycle 2: clarified UI note = whole-price, not size-adjusted). T3.3 £/sqft deferred (EPC key).
- 2026-06-16 — Phase 4 scoring engine: normalizers + 8-metric registry + scoreProperty (weighted,
  missing-data renormalization, confidence) + gatherMetricInputs + score API + ScorePanel on detail
  page. 99 tests green, typecheck clean; live-verified (SW11 1LE → 51, conf 0.85). Default weights for
  now; T4.4 profiles + T4.6 compare next.

## Decisions  _(append; capture the "why" when diverging or choosing)_

- 2026-06-16 — **No scraping of live portals as the primary path.** Three import methods supported;
  bookmarklet preferred (reads already-loaded page in the user's browser). Server-fetch is
  convenience only and must degrade to manual on parse failure.
- 2026-06-16 — **Local-first**: single libsql SQLite file, no auth. Keep an auth/runtimeConfig seam
  (T6.4) so a hosted deploy can be added later without a rewrite.
- 2026-06-16 — **Primary use = home to live in.** Default scoring profile weights
  value/commute/location/schools/safety; investment/yield (Phase 5) is optional.
- 2026-06-16 — `@nuxt/ui` resolved to **v4** (plan said v3). APIs used are compatible; proceed on v4.
- 2026-06-16 — **Zoopla parser is best-effort.** `__NEXT_DATA__` layout drifts, so we deep-find the
  listing node rather than hard-coding a path. Validate against a real saved page (X2) before
  trusting field coverage; Rightmove's `PAGE_MODEL` is more stable. Both isolate portal quirks in
  their own module and degrade to manual on parse failure.
- 2026-06-16 — Both portal parsers share `map*Model`/`map*Data` so the **bookmarklet** (posts the
  raw embedded object) and **server-fetch** (extracts it from HTML) reuse identical mapping.
- 2026-06-16 — Key-gated enrichers read keys from `process.env.NUXT_*` (not `useRuntimeConfig`) so
  they stay testable in plain Node and **skip via `cacheKey → null`** when unconfigured (avoids
  caching a false `no_match` that would block the source once a key is added).
- 2026-06-16 — Stations via TfL StopPoint (anonymous; `NUXT_TFL_APP_KEY` only raises limits) — a
  new `transit` enrichment source, distinct from the planned `tfl` commute/journey source (T2.7).

## Blockers / open questions  _(clear as resolved)_

- _(none)_
