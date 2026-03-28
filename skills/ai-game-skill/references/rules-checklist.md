# Rules Checklist

Use this checklist before considering a meaningful task complete.

## Always Preserve

- compatibility with current architecture
- main loop stability: movement, battle, result, save/load
- existing mode boundaries: gameplay layer / art production layer / runtime layer
- expandability over one-off hacks

## Contest-Sprint Constraints

- Web stack only during current sprint
- no Godot migration this week
- core experience first, asset accumulation second
- AI outputs used in final submission must be regenerated during contest window
- prior resources must be declared in compliance files

## AI Pipeline Rules

- provider mode is mandatory
- default runtime provider is `proxy`
- health gate is `/api/ai/health -> imageProviderReady`
- fusion and devour must share one image-generation core
- generated portraits must visibly apply in the front end if reported successful
- gameplay must not dead-end when AI generation is unavailable

## Gameplay Rules

- each monster remembers at most 4 moves
- move categories must remain explicit: `physical / special / status`
- type effectiveness and STAB should remain readable
- battle switch and item usage must not regress
- Apex and Legendary must remain separate tiers

## Exploration Rules

- avoid single-point hard locks for key progression items
- new map gates must include entry rule, failure messaging, and return path
- systems like statues and repel must connect to save/load and main loop

## Documentation Sync

After completing a meaningful subtask, bug fix, new system interaction, or key file change, update:
- `docs/context-log.md`
- `docs/game-architecture.md`
- `docs/system-data-flow.md`
- `docs/debugging-guide.md` when applicable
- project rules if the operating policy changed

## Practical Close-Out Question

Before stopping, ask:

`Did this change make the first-gym playable loop clearer, more stable, or more fun?`

If not, reconsider whether the task should have been deferred.
