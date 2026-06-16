# CLAUDE.md — London House-Hunt

Personal, **local-first** web app for house-hunting in London: import a property (manually, via a
browser bookmarklet, or by pasting a portal URL), auto-enrich it from free official UK data, judge
whether it's good value, and compare saved properties with a weighted scoring system. Primary use:
finding **a home to live in** (investment/yield is secondary). Stack: Nuxt 4 + Nitro · Nuxt UI v4 ·
Drizzle + libsql (SQLite) · Zod · Pinia · MapLibre · Vitest.

## How work is organized (read these first, in order)

1. **`IMPLEMENTATION.md`** — the runbook + scratchpad. Start at its **"Current state"** to see the
   phase and the next task. It defines the **9-step execution loop**, the **Definition of done**,
   project conventions, and the **Testing strategy**. Keep its Current state / Progress log /
   Decisions / Blockers sections updated as you work.
2. **`tasks.md`** — the source of truth for *what's left*: phased, checkboxed tasks (`T0.1`…`T6.4`,
   `X1`…). Work top-to-bottom, honoring dependencies.
3. **The approved plan** (`~/.claude/plans/…buzzing-bear.md`) — deeper rationale if needed.

## The loop (summary — full version in IMPLEMENTATION.md)

Pick the top unticked task in `tasks.md` → mark it `[~]` → understand/reuse existing code →
implement to the conventions → **write tests** → `npm test` + typecheck → tick `[x]`, add a
Progress-log line, update Current state. One task at a time.

## Non-negotiables

- **Tests ship with every feature.** Server logic → Vitest unit tests; Vue components/pages →
  component test via `@nuxt/test-utils` (`mountSuspended`/`renderSuspended`, file `*.nuxt.spec.ts`
  with `// @vitest-environment nuxt`); API routes → a handler test. Always cover one non-happy path.
  `npm test` must be green before ticking a box. A feature without tests is not done.
- **No scraping of live portals as a primary path.** Three import methods (bookmarklet preferred,
  server-fetch as convenience that degrades to manual, manual/paste-text). Keep portal-specific
  parsing isolated in `server/services/import/{rightmove,zoopla}.ts` and Zod-validate output.
- **Layering:** business logic in `server/services/**` (plain TS, unit-testable); `server/api/**`
  routes are thin (validate → call service → return). One canonical shape: `shared/types/canonical.ts`.
- **Validation:** Zod at every boundary (import parse, API request/response, forms).
- **Money:** integer **pounds** everywhere. **External calls:** go through the cache layer
  (`server/cache/snapshot.ts`, Phase 2+) — never hit the network inline; failures are per-source,
  non-fatal. **Scoring:** always carry a `confidence`; never fabricate a missing metric.
- **Secrets:** server-only via `runtimeConfig`; degrade gracefully when a key is absent.

## Commands

| Action | Command |
|---|---|
| Dev server | `npm run dev` (http://localhost:3000) |
| Tests (once / watch) | `npm test` / `npm run test:watch` |
| Typecheck | `npx nuxi typecheck` |
| Generate migration | `npm run db:generate` (after editing `server/db/schema.ts`) |
| Apply migration | `npm run db:migrate` |
| Inspect DB | `npm run db:studio` |

## Checkpoint routine (do this at EVERY major checkpoint)

A "major checkpoint" = a phase completes, or a significant task/feature is finished. At each one,
**always** run this sequence before moving on:

1. **Green bar:** `npm test` passes and `npx nuxi typecheck` is clean. Fix before continuing.
2. **Update tracking:** tick the boxes in `tasks.md`; update `IMPLEMENTATION.md` Current state +
   Progress log (and Decisions / Blockers if relevant).
3. **Commit** all changes with a descriptive message + the `Co-Authored-By` trailer.
4. **Push** to `origin` (`ronanbrett` GitHub account over HTTPS).

Committing + pushing at checkpoints is durably authorized — do it without re-asking.

## Stop points (still confirm with the user first)

Opening a **PR**, deploying, destructive DB ops (dropping tables, deleting real data), rewriting
published history (force-push), or any decision that contradicts the approved plan. (Routine
checkpoint commits + pushes to this feature branch are pre-authorized per the routine above.)

## Current status (keep roughly in sync with IMPLEMENTATION.md)

Phase 0 (skeleton) complete; Phase 1 (import + view) in progress. The DB has 15 tables migrated to
`data/app.db` (gitignored). `.env` keys (EPC, TfL, MapTiler) are only needed from Phase 2 onward.
