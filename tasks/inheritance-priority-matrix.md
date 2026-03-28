# Inheritance Priority Matrix

## Goal

Use this matrix when the project is being "restarted without starting from zero":
- keep what already proves value
- rebuild what blocks velocity or clarity
- defer what does not strengthen the first-gym playable loop

Contest context:
- Timebox: `2026-03-24` to `2026-03-29`
- Delivery target: opening guide -> capture -> growth -> gym battle -> reward -> save/load
- Core rule: core experience first, asset volume second

## Priority Definitions

### 1) Must Inherit

Definition:
- Keep directly.
- Only allow targeted fixes, not speculative rewrites.

Use when:
- the module already supports the playable core loop
- replacing it would create more risk than value this week
- it defines stable project direction or architecture constraints

### 2) Recommend Inherit

Definition:
- Keep the direction and reusable parts.
- Allow partial refactor around the edges.

Use when:
- the idea is correct
- some implementation debt exists
- keeping it is still faster than rebuilding from scratch

### 3) Optional Inherit

Definition:
- Preserve as bonus capability, not sprint backbone.
- Keep data/interfaces if cheap; do not spend critical time polishing it.

Use when:
- it improves presentation or future scalability
- the demo can still succeed without it

### 4) Recommend Rebuild

Definition:
- Keep the product goal, but redesign the implementation.
- Stop patching if the current version is slowing the team down.

Use when:
- logic is too coupled
- player-facing clarity is weak
- repeated fixes are more expensive than rebuilding the path cleanly

### 5) Defer This Week

Definition:
- Freeze for now.
- Do not delete, but do not continue investing sprint time unless it unblocks the core loop.

Use when:
- it is mostly packaging or scale
- it does not materially improve the first-gym demo

## Decision Rule

Ask one question before touching a module:

`Does this noticeably improve the player's path from opening to first gym clear?`

Decision:
- yes, and it is required: `Must Inherit` or `Recommend Inherit`
- yes, but only as a bonus: `Optional Inherit`
- no, or not this week: `Recommend Rebuild` or `Defer This Week`

## Current Project Classification

| Area | Files / Scope | Priority | This Week Action | Why |
|---|---|---|---|---|
| Web runtime shell | `index.html`, `styles.css`, `game.js`, `scripts/dev-server.mjs` | Must Inherit | keep and patch only where demo flow needs it | already forms the runnable contest shell |
| Core gameplay loop skeleton | `src/game/world-events.js`, `src/game/battle-system.js`, `src/game/rendering.js` | Must Inherit | keep loop, fix guide/progression/balance issues on top | movement, battle, result, save/load are the real demo backbone |
| Save/load compatibility | save state + normalization paths in `src/game/rendering.js` and related loaders | Must Inherit | keep compatibility and extend carefully | breaking saves during contest week is too risky |
| World-lore guardrails | `docs/world-lore.md`, progression narrative constraints | Must Inherit | keep as narrative contract | this is the project's differentiator and prevents generic clone drift |
| Knowledge-base and rules discipline | `rules/*`, `docs/context-log.md`, architecture/data-flow/debugging docs | Must Inherit | continue updating every meaningful iteration | protects velocity and shared memory during contest sprint |
| AI provider architecture | `scripts/load-local-env.mjs`, provider health/task flow, `.env.example` | Must Inherit | keep provider model and health-check design | correct abstraction even if some UX still needs cleanup |
| Battle framework | `src/game/battle-system.js`, move/type/status model | Recommend Inherit | preserve model, refine strategy clarity and early-game tuning | direction is right and close to target loop |
| Map / NPC / species data base | `src/game/globals.js` data sections | Recommend Inherit | reuse data, trim or rebalance where needed | content base exists, but should serve tighter demo scope |
| Utility panel ecosystem | `src/game/ui-panels.js` | Recommend Inherit | keep core panels, simplify surfacing and reduce clutter | structure exists, but some UX is still too wide for sprint |
| Acceptance automation | `scripts/acceptance-interaction.mjs` | Recommend Inherit | keep and extend toward first-gym acceptance | reusable validation is valuable during contest crunch |
| Merchant pagination, statues, repel, Apex rewards | runtime systems already wired | Recommend Inherit | retain if they support current loop, avoid feature sprawl | useful systems, but should not dominate sprint time |
| Portrait favorites | player portrait history / favorites | Optional Inherit | keep working if stable, no major expansion this week | nice retention loop, not a first-gym blocker |
| First-encounter portrait choice | pokedex candidate flow | Optional Inherit | keep only if it does not interrupt onboarding | flavorful, but not core to demo success |
| Evolution animation polish | fusion/devour presentation layer | Optional Inherit | keep lightweight only | presentation bonus, not loop-critical |
| Large map expansion | extra maps, extra routes, content scale-up | Defer This Week | freeze unless needed to fix progression dead-end | scale is less important than clarity and completeness |
| Mass art generation | many NPC/monster portraits, broad style polish | Defer This Week | pause broad generation batches | risk of spending sprint on packaging over gameplay |
| Huge roster growth | large species count increase | Defer This Week | keep current usable roster, add only if loop demands it | a smaller balanced roster is better for demo |
| AI art user-facing end-to-end flow | player/NPC/monster generation UX in `src/game/bootstrap-ai.js` and related runtime refresh paths | Recommend Rebuild | reduce to smallest dependable flow, remove fragile branches | concept is valuable, but unstable UX hurts trust |
| Opening guidance and progression handoff | tutorial text, route hints, quest triggers across `world-events.js` / `ui-panels.js` | Recommend Rebuild | rebuild for clarity from first minute to gym pass | current risk is player confusion, which is worse than missing content |
| Overgrown core modules | `src/game/globals.js`, `src/game/bootstrap-ai.js`, `src/game/rendering.js`, `src/game/ui-panels.js` | Recommend Rebuild | continue splitting responsibilities while protecting runtime behavior | file size and coupling are active iteration drag |

## Immediate Execution Order

1. `Must Inherit`: protect runtime shell, save/load, core battle/exploration loop.
2. `Recommend Rebuild`: opening guidance, progression clarity, unstable AI UX, oversized modules that block edits.
3. `Recommend Inherit`: rebalance battle/map data and keep acceptance coverage growing.
4. `Optional Inherit`: retain stable polish features without letting them expand.
5. `Defer This Week`: map scale, asset batches, large roster growth.

## Practical Rule For This Sprint

When a feature competes for time with first-gym closure:
- choose the one that makes the playable loop clearer
- choose the one that reduces player confusion
- choose the one that improves strategic depth over raw presentation

If a feature mainly increases quantity, not clarity or fun, downgrade it.
