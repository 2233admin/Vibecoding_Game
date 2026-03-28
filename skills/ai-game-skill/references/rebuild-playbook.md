# Rebuild Playbook

Use this file when the goal is:
- rebuild the demo quickly
- keep validated value
- stop spending time on half-finished side systems

## Rebuild Principle

Do not restart from zero.
Do not preserve weak code just because it already exists.

Use this order:
1. protect the runnable shell
2. protect save/load and core battle/exploration loop
3. rebuild onboarding and progression clarity
4. simplify unstable AI art UX
5. defer scale and packaging

## Fast Rebuild Sequence

### Step 1: Confirm the minimal success path

The target path is:
- new game starts cleanly
- player knows where to go
- player can catch at least one monster
- player can level, switch, and use items
- player can reach and beat the first gym
- reward and save/load continue correctly

If any task does not improve one of those, downgrade it.

### Step 2: Audit using five labels

Use:
- `Must Inherit`
- `Recommend Inherit`
- `Optional Inherit`
- `Recommend Rebuild`
- `Defer This Week`

If needed, also load:
- `C:/Users/cenjy/.codex/skills/contest-reset-prioritizer/SKILL.md`

## What To Keep Immediately

- current Web runtime shell
- local dev server and provider architecture
- battle framework
- save/load compatibility
- world-lore guardrails
- docs/rules update discipline

## What To Rebuild Early

- opening guidance and route clarity
- progression handoff between tutorial beats
- player-facing AI art flows that claim success but feel unreliable
- oversized modules that block edits on every pass

## What To Freeze

- large map growth
- mass content growth
- broad art generation campaigns
- heavy polish detached from first-gym closure

## 48-Minute Triage Pattern

When time is tight, use this pattern:

1. Spend 10 minutes identifying the single broken point in the core loop.
2. Spend 10 minutes locating exact file ownership.
3. Spend 20 minutes implementing the smallest stable fix.
4. Spend 8 minutes validating and syncing docs.

Repeat instead of attempting giant rescue refactors.

## Minimal Acceptance Checks

Before saying the rebuild is progressing well, verify:
- no progression dead-end in opening path
- battle switch and item use work in at least one manual pass
- gym gate conditions are understandable
- win reward writes progression flags
- reload after key progress does not break

## AI Art During Rebuild

Use AI art as support, not as the rebuild center.

Keep:
- provider health
- one working player portrait path
- one working NPC interaction portrait path if stable
- one working evolution image path if stable

Defer:
- mass portrait generation
- broad candidate systems if they interrupt onboarding
- polish-heavy art workflows that do not change gameplay quality

## Close-Out Standard

A rebuild step is successful when it makes the demo:
- clearer
- more stable
- more strategically readable

Not merely larger.
