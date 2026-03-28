# Task Board

Use this board as the coordination hub for the one-week Web demo sprint.

## Sprint Scope (Locked)

- Timeline: 2026-03-24 to 2026-03-29
- Goal: playable demo that can finish the first gym
- Stack: Web only (`index.html`, `styles.css`, `src/game/*`, `scripts/*`)
- Out of scope: Godot migration this week

## Working Rules

- One active task per owner.
- Every task must list files and acceptance criteria.
- Move tasks across sections; do not duplicate.
- Every completed task must leave a short handoff note.

## Ready

### DEMO-006

- Owner: `systems-agent`
- Goal: lock Newbie Village -> Mond Meadow -> Grass Gym onboarding spine
- Files: `src/game/world-events.js`, `src/game/ui-panels.js`, `tasks/demo-week-plan.md`
- Acceptance:
  1. Five-stage experience loop (教学->实践->受挫->引导->掌握) is reflected in objective text + event gating
  2. Two villain battles happen before gym challenge and cannot be skipped accidentally

### DEMO-007

- Owner: `combat-agent`
- Goal: implement ice type + early grass-control combat identity
- Files: `src/game/globals.js`, `src/game/battle-system.js`
- Acceptance:
  1. Ice type matchup table and UI labels are fully connected
  2. Early grass monsters show sustain/control moves instead of burst-only kits

### DEMO-008

- Owner: `encounter-agent`
- Goal: add Mond Meadow rare monsters and pre-gym legendary encounter rules
- Files: `src/game/globals.js`, `src/game/world-events.js`, `src/game/bootstrap-ai.js`
- Acceptance:
  1. Meadow has 4 new rare monsters with non-legendary naming tone
  2. Before first-gym clear, player can encounter up to 3 legendary slots with low capture odds
  3. Encounter system guarantees >=80% chance to meet at least one legendary before gym clear
  4. After gym clear or grass authority unlock, Verdion catch-rate boost is active

### DEMO-005

- Owner: `core-agent`
- Goal: use inheritance priority matrix to decide what must be kept, rebuilt, or deferred this week
- Files: `tasks/inheritance-priority-matrix.md`, `docs/game-architecture.md`, `docs/system-data-flow.md`
- Acceptance:
  1. Every major gameplay/art/AI module has a clear priority label
  2. Rebuild work focuses on opening -> capture -> gym closure instead of feature sprawl

### DEMO-001

- Owner: `gameplay-agent`
- Goal: lock the first-gym playable loop end-to-end
- Files: `src/game/world-events.js`, `src/game/battle-system.js`, `src/game/ui-panels.js`
- Acceptance:
  1. Opening guide -> capture -> scout -> professor -> gym pass -> leader clear
  2. No dead-end in progression flags (`storyStage`, `gymPass`, `gymWon`)

### DEMO-002

- Owner: `balance-agent`
- Goal: tune early economy and encounter curve for first-gym run
- Files: `src/game/globals.js`
- Acceptance:
  1. Gym can be cleared without grind wall
  2. Battle items and switch strategy remain meaningful

### DEMO-003

- Owner: `qa-agent`
- Goal: add and maintain demo acceptance checklist/runbook
- Files: `tasks/demo-week-plan.md`, `docs/debugging-guide.md`
- Acceptance:
  1. Checklist covers all 6 demo exit criteria
  2. Can reproduce pass/fail quickly

### DEMO-004

- Owner: `narrative-agent`
- Goal: align first-gym flow dialogues with world lore guardrails
- Files: `src/game/world-events.js`, `src/game/ui-panels.js`, `docs/world-lore.md`
- Acceptance:
  1. Story copy clearly states "badge != authority inheritance"
  2. Next-step hook after gym points to trial qualification, not instant god-tier progression

## In Progress

### DEMO-000

- Owner: `core-agent`
- Start date: 2026-03-24
- Goal: sprint setup + scope freeze artifacts
- Files: `rules/project-rules.md`, `tasks/board.md`, `tasks/demo-week-plan.md`
- Current blocker: none
- Next checkpoint: sync docs and publish status to team

## Blocked

- None

## Done

- None

## Handoff Template

```md
### HANDOFF
- From:
- To:
- Task:
- Need:
- Files involved:
- Expected output:
```
