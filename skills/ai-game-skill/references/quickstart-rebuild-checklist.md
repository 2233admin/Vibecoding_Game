# Quickstart Rebuild Checklist

Use this checklist when opening the project in a fresh session and trying to regain momentum fast.

## 1. Read Order

Read in this order:
1. `references/demo-scope.md`
2. `references/demo-content-baseline.md`
3. `references/world-lore-core.md`
4. `references/ai-art-pipeline.md`
5. `references/module-map.md`
6. `references/rebuild-playbook.md`
7. `references/rules-checklist.md`

## 2. First Questions To Answer

Answer these before editing:
- what is the smallest playable goal for this sprint?
- where is the current player most likely to get confused?
- which module owns that confusion?
- does AI art help the loop here, or distract from it?

## 3. First Files To Inspect

For first-gym demo rebuild, inspect these first:
- `src/game/world-events.js`
- `src/game/battle-system.js`
- `src/game/ui-panels.js`
- `src/game/rendering.js`
- `src/game/bootstrap-ai.js`
- `src/game/globals.js`

## 4. First Things To Protect

- startup works
- movement works
- battle starts and resolves
- save/load still functions
- no progression flag dead-end

## 5. First Things To Simplify

- unclear tutorial text
- route hints that do not point to the next step
- panels that expose too much at once
- AI generation flows that need too many user actions for basic outcomes

## 6. First Validation Pass

Run or verify:
- app boots
- one capture works
- one switch works
- one battle item use works
- one save/reload pass works

## 7. Documentation Sync

After each meaningful step, update:
- `docs/context-log.md`
- `docs/game-architecture.md`
- `docs/system-data-flow.md`
- `docs/debugging-guide.md` when a bug pattern changed
