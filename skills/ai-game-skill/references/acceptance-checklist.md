# Acceptance Checklist

Use this file when validating whether the demo is healthy enough to continue or present.

## Core Acceptance

- the app boots
- the main canvas or main scene renders
- a new session can start without an immediate dead-end
- the next objective is understandable
- at least one wild encounter can occur
- capture works
- switching works
- battle item usage works
- save/load works

## First-Gym Acceptance

- the route to first gym is discoverable
- the gym gate condition is understandable
- the leader battle starts correctly
- victory updates progression flags
- reward delivery is visible
- reload after victory keeps progress

## AI Art Acceptance

- `/api/ai/health` returns a coherent provider state
- player portrait generation, if enabled, visibly applies after success
- NPC portrait interaction path is natural if enabled
- evolution image generation does not break gameplay if delayed or unavailable

## Stability Acceptance

- no text overflow in key interaction areas
- no blocked panel actions caused by hidden or unreachable controls
- no obvious progression flag dead-end in opening path

## Contest Acceptance

- final scope still centers on the playable core loop
- AI outputs used in the final build are traceable
- docs and rules are synced for meaningful changes

## Suggested Validation Commands

Primary:
- `node scripts/acceptance-interaction.mjs`
- `Invoke-WebRequest -UseBasicParsing http://127.0.0.1:4310/api/ai/health`

If using this skill's helper script:
- `node C:/Users/cenjy/.codex/skills/ai-game-skill/scripts/run-demo-recovery-check.mjs --project-root E:/Ai/GBIT_GAME`
