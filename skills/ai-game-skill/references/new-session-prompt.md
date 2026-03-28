# New Session Prompt

Use this template when starting a fresh session and you want the new agent to use this skill well from the first message.

## Short Version

```text
Use $ai-game-skill at C:/Users/cenjy/.codex/skills/ai-game-skill.
Project root: E:/Ai/GBIT_GAME
Goal: continue rebuilding the web demo so the first-gym loop is clear and stable.
Preserve validated systems, rebuild weak paths, and follow the skill's world lore, AI art pipeline, demo scope, and recovery checklist.
```

## Strong Handoff Version

```text
Use $ai-game-skill at C:/Users/cenjy/.codex/skills/ai-game-skill.
Project root: E:/Ai/GBIT_GAME

Please follow this order:
1. Read demo-scope, demo-content-baseline, gameplay-loop, quickstart-rebuild-checklist.
2. Protect the validated web runtime shell, save/load, and battle/exploration core loop.
3. Prioritize opening guidance, capture flow, gym pass progression, leader battle, and reward/save continuity.
4. Keep AI art provider architecture, but simplify fragile user-facing image flows if they block gameplay clarity.
5. Update docs/context-log/rules after meaningful changes.

If needed, also use:
- C:/Users/cenjy/.codex/skills/contest-reset-prioritizer/SKILL.md

Before major edits, run:
node C:/Users/cenjy/.codex/skills/ai-game-skill/scripts/run-demo-recovery-check.mjs --project-root E:/Ai/GBIT_GAME
```

## When To Use Short vs Strong

Use the short version when:
- the session is simple
- you only need the agent to load project context correctly

Use the strong version when:
- the codebase is messy
- you need active rebuild behavior
- you want the session to immediately optimize for demo recovery
