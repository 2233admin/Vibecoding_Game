# Demo Content Baseline

Use this file to answer a simple question fast:

`What does the current demo already contain at minimum?`

This is not the full game ambition.
It is the practical baseline for restoring a runnable demo quickly.

## Minimum Playable Geography

Current map ids present in data:
- `town`
- `route`
- `meadow`
- `lake`
- `orchard`
- `reef`
- `cave`
- `deep_cave`
- `ridge`
- `islet`
- `sanctum`
- `gym`

For first-gym demo recovery, only these are truly critical:
- `town`
- `route`
- `gym`

These are useful support maps if the opening loop expands:
- `meadow`
- `lake`

Everything deeper than that is secondary for first-gym closure.

## Core NPC Set

Known key NPC ids in data:
- `professor` -> town intro / starter / progression handoff
- `caretaker` -> town support interaction
- `merchant` -> town shop access
- `quartermaster` -> town supply interaction
- `scout` -> early route trainer gate
- `leader` -> first gym leader

Extended route NPC ids already present:
- `breeder` -> orchard
- `captain` -> reef
- `ace` -> ridge
- `warden` -> islet

For fast demo rebuild, keep focus on:
- `professor`
- `scout`
- `leader`
- `merchant` / `quartermaster` if they support clarity and supplies

## Baseline Monster Set

Starter / early-loop monsters already present:
- `sprigoon`
- `embercub`
- `voltkit`

Additional implemented monsters present in data:
- `mistowl`
- `gearcub`
- `petalisk`
- `cinderpup`
- `sunfang`
- `warmaul`
- `blazedrake`
- `snowkit`
- `aurorafang`

Fast rebuild guidance:
- first-gym baseline only needs a small early roster
- keep extra species if stable
- do not make wide roster growth a blocker

## Baseline Battle / Progression Nodes

Observed story and battle ladder:
1. choose starter with `professor`
2. story moves to `storyStage = 1`
3. capture at least 2 wild monsters
4. reaching capture threshold moves to `storyStage = 2`
5. defeat `scout`
6. `handleTrainerVictory("scout")` advances to `storyStage = 3`
7. professor follow-up grants `gymPass`
8. player can challenge `leader`
9. defeating `leader` sets `gymWon = true`, advances story, grants badge and rewards

## Minimum Battle Checks

At minimum, recovery should preserve:
- wild battle starts
- capture succeeds
- switching works
- battle item use works
- trainer battle against `scout` works
- trainer battle against `leader` works

## Early Access Gates

Important visible gates already in logic:
- before starter / early story, route access is restricted
- gym entry requires `gymPass`
- later route gates depend on flags like `gymWon`, `breederDefeated`, `captainDefeated`, `aceDefeated`, `wardenDefeated`

For the first-gym demo, the only gate that must feel crystal clear is:
- how to obtain `gymPass`

## Recovery Priority From This Baseline

If rebuilding under time pressure:
1. keep `town`, `route`, `gym`
2. keep `professor`, `scout`, `leader`
3. keep starter + early wild roster
4. keep story stages and gym pass flow
5. treat deeper regions and larger roster as secondary content already present, not immediate rebuild targets
