---
name: ai-game-skill
description: Core project skill for the GBIT AI-assisted monster-RPG contest project. Use when Codex is implementing, refactoring, reviewing, reprioritizing, or rebuilding gameplay, worldbuilding, AI image generation, contest-demo scope, or module boundaries in this codebase. Covers the normalized world lore, AI art pipeline architecture, first-gym demo scope, rebuild playbook, file ownership map, and mandatory project rules.
---

# AI Game Skill

## Overview

This skill is the project onboarding pack for future Codex sessions. Use it before changing gameplay loop, AI art features, narrative direction, contest scope, or when rebuilding the demo quickly from a messy intermediate state.

## Use In A New Session

If you want a fresh session to use this skill immediately, say one of these early:

- `Use $ai-game-skill at C:/Users/cenjy/.codex/skills/ai-game-skill and help me continue rebuilding the demo.`
- `Use the skill at C:/Users/cenjy/.codex/skills/ai-game-skill. Rebuild the first-gym demo loop without losing validated systems.`

For a stronger handoff, use the template in [new-session-prompt.md](references/new-session-prompt.md).

## Workflow

### 1. Re-anchor on the current demo target

Read [demo-scope.md](references/demo-scope.md) first.
Then read [quickstart-rebuild-checklist.md](references/quickstart-rebuild-checklist.md) if this is a fresh or recently reset session.
Read [demo-content-baseline.md](references/demo-content-baseline.md) if you need to know what content is already present without rediscovering maps, NPCs, species, and battle nodes from scratch.

Assume the active sprint target is:
- opening guide
- capture loop
- growth loop
- first gym battle
- victory reward
- save/load continuity

If a task does not strengthen that loop, downgrade it unless the user explicitly reprioritizes.

Read [gameplay-loop.md](references/gameplay-loop.md) when rebuilding player journey or validating whether the loop actually feels complete.

### 1.5 Use the rebuild playbook when time is short

Read [rebuild-playbook.md](references/rebuild-playbook.md) when:
- the user wants to restart cleanly without losing validated work
- the codebase feels half-finished or scattered
- you need to rebuild the demo in the shortest practical time

Use that file to choose execution order and avoid rebuilding low-value systems first.

### 2. Load the normalized world lore before writing narrative or systems

Read [world-lore-core.md](references/world-lore-core.md) when touching:
- lore
- gym progression
- evolution systems
- Apex / Legendary content
- dialogue that references badges, authority, or divine power

Treat that reference as the clean operational summary even if the source lore doc contains encoding damage.

### 3. Load the AI art reference before touching image generation

Read [ai-art-pipeline.md](references/ai-art-pipeline.md) when touching:
- player portrait generation
- NPC portrait generation
- monster portrait generation
- fusion / devour evolution images
- provider selection
- runtime refresh of generated art

Keep one principle stable:
- provider architecture is core
- art UX can be simplified
- gameplay must continue even if generation is unavailable

### 4. Load the module map before editing code

Read [module-map.md](references/module-map.md) before large refactors.

Use it to decide:
- which file owns the change
- whether the edit belongs in `src/game/*`
- when a file has become a rebuild candidate instead of a patch candidate

### 5. Load the rules checklist before finalizing work

Read [rules-checklist.md](references/rules-checklist.md) before finishing a meaningful task.
Read [acceptance-checklist.md](references/acceptance-checklist.md) before calling the demo stable.

Always sync:
- rules
- docs
- context log

### 6. Use the reset prioritizer when scope becomes messy

If the user asks what to keep, rebuild, or defer, also use:
- [contest-reset-prioritizer](C:/Users/cenjy/.codex/skills/contest-reset-prioritizer/SKILL.md)

That skill decides priority.
This skill provides the project-specific content that should be judged.

## Operating Rules

- Preserve validated value.
- Rebuild confusing or brittle paths without guilt.
- Prefer the smallest complete playable loop over asset volume.
- Do not let AI art work consume sprint capacity needed for gameplay closure.
- Keep save/load and main loop stable.
- Keep implementation inside current Web stack during contest sprint.

## Validation

If the project root is available locally, you can run the helper script:

`node C:/Users/cenjy/.codex/skills/ai-game-skill/scripts/run-demo-recovery-check.mjs --project-root <project_root>`

This does not replace deeper testing, but it quickly checks:
- core project files exist
- acceptance script exists
- acceptance interaction script can be launched

## Reference Map

- [world-lore-core.md](references/world-lore-core.md)
- [ai-art-pipeline.md](references/ai-art-pipeline.md)
- [demo-scope.md](references/demo-scope.md)
- [demo-content-baseline.md](references/demo-content-baseline.md)
- [gameplay-loop.md](references/gameplay-loop.md)
- [quickstart-rebuild-checklist.md](references/quickstart-rebuild-checklist.md)
- [rebuild-playbook.md](references/rebuild-playbook.md)
- [new-session-prompt.md](references/new-session-prompt.md)
- [module-map.md](references/module-map.md)
- [rules-checklist.md](references/rules-checklist.md)
- [acceptance-checklist.md](references/acceptance-checklist.md)
