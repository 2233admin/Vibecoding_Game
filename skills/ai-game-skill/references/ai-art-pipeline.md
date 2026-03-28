# AI Art Pipeline

Use this file when touching runtime image generation, portrait replacement, or fusion/devour image flows.

## Pipeline Goal

The AI art system exists to support:
- player identity expression
- NPC interaction presentation
- monster and evolution feedback

It does not outrank the playable loop.

## Core Architecture

Runtime generation uses a provider model.

Preferred provider order:
- `proxy` as default
- `gemini-official` as fallback

Key behavior:
- health is determined by `/api/ai/health`
- the front end should trust `imageProviderReady`
- gameplay must still continue if image generation is unavailable

## Main Entry Points

Typical touchpoints in the codebase:
- `scripts/dev-server.mjs`
- `scripts/load-local-env.mjs`
- `scripts/generate-runtime-asset.mjs`
- `src/game/bootstrap-ai.js`
- `src/game/evolution-pipeline.js`
- `assets.generated.js`

## Player Portrait Flow

Expected behavior:
- submit prompt
- generate stable asset key
- queue task
- poll task result
- register generated asset
- remap current player portrait
- refresh story focus and front-end views

User-facing rule:
- if the UI says portrait generation succeeded, the portrait should actually become visible immediately

## NPC Portrait Flow

Expected behavior:
- trigger from interaction, not only from a side panel button
- first interaction may auto-request art
- on completion, refresh story focus to the NPC

User-facing rule:
- the interaction path must feel natural

## Monster and Evolution Art Flow

Expected behavior:
- monster art can be generated as runtime assets
- fusion and devour should share one image-generation core
- evolution should provide gameplay feedback even if image generation is delayed or unavailable

Keep these stable:
- one shared evolution image pipeline
- white background / no watermark guardrails
- no duplicated logic between fusion and devour branches

## First-Encounter Portrait Choice

This is a bonus system, not a sprint backbone.

If kept:
- first encounter may generate two candidate portraits
- player chooses one for pokedex identity

If it interrupts onboarding or confuses flow, simplify or temporarily degrade it.

## Reliability Rules

Prefer preserving:
- provider abstraction
- local env loading
- task queue and health-check endpoints

Prefer rebuilding:
- fragile UI states where "generated" does not visibly apply
- duplicated generation branches
- flows that require too many manual steps for obvious outcomes

## Contest-Week Priority

During the first-gym sprint:
- keep the provider architecture
- keep the minimal portrait replacement path
- keep evolution generation architecture if stable
- defer mass asset generation and non-critical polish

If forced to choose:
- choose gameplay clarity over more generated art
