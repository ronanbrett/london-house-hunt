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

- **Phase:** 0 (Skeleton) — **complete**. ✅ Moving to Phase 1.
- **Done:** T0.1–T0.6. Scaffold + deps; libsql `useDb()`; full Drizzle schema (15 tables) migrated
  to `data/app.db`; canonical Zod types in `shared/types/canonical.ts`; dev server boots (HTTP 200).
- **Next task:** **T1.1** — import detection (`server/services/import/detect.ts`) + shared canonical
  mapper. Then T1.2 Rightmove parser (`window.PAGE_MODEL`).
- **Dev server:** left running in background on :3000 (HMR). Restart if it gets stale.
- **Env/keys:** none set yet (see `.env.example`; needed from Phase 2 onward, not for P0/P1 core).
- **Versions of note:** `@nuxt/ui` v4.8.2, `zod` v4.4.3 (canary pin in manifest was aligned to
  stable to satisfy @nuxt/ui's peer range), `drizzle-orm` 0.45, `vitest` 4.

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
- [ ] **7. Test** — add/extend a Vitest test when the task adds parsing, scoring, or value logic
  (use fixtures from `tests/fixtures/`). UI-only tasks: verify manually in `npm run dev`.
- [ ] **8. Record** — tick the task `[x]` in `tasks.md`; append a one-line **Progress log** entry;
  update **Current state** (Done / Next task); add any new follow-up tasks to `tasks.md`.
- [ ] **9. Stop points** — pause for the user before: anything outward-facing (git push, PR,
  deploy), destructive DB ops, or a decision that contradicts the approved plan.

### Definition of done (every task)
- Code typechecks; affected unit tests pass; no new console errors in `npm run dev`.
- Input/output validated with Zod where data crosses a boundary.
- `tasks.md` checkbox ticked + Progress log entry written.

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

## Decisions  _(append; capture the "why" when diverging or choosing)_

- 2026-06-16 — **No scraping of live portals as the primary path.** Three import methods supported;
  bookmarklet preferred (reads already-loaded page in the user's browser). Server-fetch is
  convenience only and must degrade to manual on parse failure.
- 2026-06-16 — **Local-first**: single libsql SQLite file, no auth. Keep an auth/runtimeConfig seam
  (T6.4) so a hosted deploy can be added later without a rewrite.
- 2026-06-16 — **Primary use = home to live in.** Default scoring profile weights
  value/commute/location/schools/safety; investment/yield (Phase 5) is optional.
- 2026-06-16 — `@nuxt/ui` resolved to **v4** (plan said v3). APIs used are compatible; proceed on v4.

## Blockers / open questions  _(clear as resolved)_

- _(none)_
