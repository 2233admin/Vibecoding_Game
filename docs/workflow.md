# Multi-Agent Workflow

This repo is set up to support either:

- one coordinator running all four roles in sequence with strict boundaries
- or four parallel chats/sessions working at the same time

## Mandatory Rule References

Before any implementation, all agents must read:

- `rules/project-rules.md`
- `rules/knowledge-base-rules.md`
- `docs/game-architecture.md`
- `docs/system-data-flow.md`
- `docs/debugging-guide.md`
- `docs/context-log.md`

## Recommended Setup

Open five sessions:

1. `coordinator`
2. `frontend-agent`
3. `gameplay-agent`
4. `backend-agent`
5. `art-pipeline-agent`

The coordinator does not own feature files by default. It assigns work, tracks blockers, and integrates results.

## Coordinator Loop

1. Read `tasks/board.md`
2. Pick one ready task per agent
3. Confirm file boundaries
4. Let agents work in parallel
5. Collect handoffs
6. Run integration check
7. Move tasks to `Done`

## File Safety Rules

- Do not let two agents edit the same file at the same time.
- If a task crosses file boundaries, split it into two subtasks.
- Prefer contract-first handoffs:
  - gameplay defines state hooks
  - frontend consumes them
  - backend exposes generation commands
  - art pipeline decides naming and output shape

## Branch Option

If you want true git isolation, use one branch per role:

- `codex/frontend-*`
- `codex/gameplay-*`
- `codex/backend-*`
- `codex/art-*`

## Merge Checklist

Before merging agent work:

- syntax checks pass
- manifests point to real assets
- UI text matches gameplay state
- scripts referenced in `package.json` exist
- no stale temp files were accidentally introduced

## Fastest Real-World Pattern

For this project, the best order is:

1. `gameplay-agent` defines needed hooks and world changes
2. `frontend-agent` binds presentation to those hooks
3. `backend-agent` exposes generation/runtime tools
4. `art-pipeline-agent` produces/registers assets against the final contracts

## Definition of Ready

A task is ready when it has:

- a clear owner
- a concrete output
- a bounded file list
- no unresolved dependency

## Definition of Done

A task is done when it has:

- implemented output
- written handoff notes
- passed basic verification
- been moved on the board
