# Module Map

Use this file before large edits.

## Front-End Shell

- `index.html`
  Owns page structure, major DOM anchors, script loading order.
- `styles.css`
  Owns visual language, panel layout, HUD styling, responsive behavior.
- `game.js`
  Should remain a lightweight entry only.

## Core Runtime Modules

- `src/game/globals.js`
  Owns constants, maps, items, species, move data, encounter tables, and other heavy data registries.
  Warning:
  this file is useful but oversized; prefer surgical changes or further extraction.

- `src/game/world-events.js`
  Owns movement consequences, map transitions, NPC interaction, route guidance, and event triggers.
  This is one of the highest-value files for first-gym demo closure.

- `src/game/battle-system.js`
  Owns turn resolution, damage, status, switching, items in battle, trainer victory, defeat handling.
  This is core loop code and should be treated as high protection.

- `src/game/ui-panels.js`
  Owns player-facing panels: bag, party, codex, utility, battle options, and many dialogue-side surfaces.
  Warning:
  this file is structurally important but easy to overgrow.

- `src/game/rendering.js`
  Owns map rendering, asset loading, save/load, refresh logic, and shared runtime utilities.
  Warning:
  changes here can affect many systems at once.

- `src/game/bootstrap-ai.js`
  Owns AI service bootstrapping, image task handling, portrait application, health checks, and runtime refresh bridges.
  Warning:
  valuable architecture, but high risk for fragile UX if changed casually.

- `src/game/evolution-pipeline.js`
  Owns the shared fusion/devour image generation core and request construction.
  Keep one pipeline, not duplicates.

## Server / Tooling

- `scripts/dev-server.mjs`
  Owns local API routes, task queue, AI health endpoints, runtime generation endpoints.

- `scripts/load-local-env.mjs`
  Owns local env loading without overwriting injected environment variables.

- `scripts/generate-runtime-asset.mjs`
  Owns runtime asset generation for monster and character imagery.

- `scripts/acceptance-interaction.mjs`
  Owns automated interaction acceptance checks.

- `scripts/bootstrap-competition-project.mjs`
  Owns contest project bootstrapping and compliance template generation.

## Editing Guidance

If a change is about:
- progression clarity -> start in `world-events.js`
- battle strategy -> start in `battle-system.js`
- panel clutter or missing controls -> start in `ui-panels.js`
- save compatibility or resource refresh -> start in `rendering.js`
- AI generation UX -> start in `bootstrap-ai.js`
- shared fusion/devour image logic -> start in `evolution-pipeline.js`

## Rebuild Candidates

These are valuable but should be treated carefully because they are iteration bottlenecks:
- `src/game/globals.js`
- `src/game/bootstrap-ai.js`
- `src/game/rendering.js`
- `src/game/ui-panels.js`

When working in these, prefer:
- extracting responsibilities
- keeping behavior stable
- avoiding broad rewrites unless the loop is blocked
