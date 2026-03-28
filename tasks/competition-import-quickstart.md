# Competition Import Quickstart

## Goal

Create a new contest project quickly while keeping source disclosure and creation evidence complete.
Contest window: `2026-03-24` to `2026-03-29`.

## 1) Create New Project (Web Minimal)

```powershell
cd E:\Ai\GBIT_GAME
node scripts/bootstrap-competition-project.mjs --target ..\GBIT_GAME_CONTEST --profile web-minimal
```

If target folder already exists and you want to refresh templates:

```powershell
node scripts/bootstrap-competition-project.mjs --target ..\GBIT_GAME_CONTEST --profile web-minimal --force
```

## 2) Install and Run

```powershell
cd E:\Ai\GBIT_GAME_CONTEST
npm install
npm run dev
```

Open:

- [http://127.0.0.1:4310](http://127.0.0.1:4310)

## 3) Fill Compliance Files Before Submission

1. `COMPLIANCE/third-party-declaration.md`
2. `COMPLIANCE/creation-journal.md`
3. `COMPLIANCE/submit-checklist.md`

Must-pass fairness requirements:
- Any AI outputs used in final submission must be regenerated during `2026-03-24` to `2026-03-29`.
- If you reuse prior references/templates/ideas, declare them explicitly and mark whether they were reworked during contest.
- Prioritize expressing the core gameplay idea within timebox; asset expansion and packaging are secondary unless they directly improve core experience.

## 4) Recommended Daily Rule

At end of each day, append:

- what changed
- which files were imported/rewritten today
- whether any third-party or AI assets were added
- evidence paths for AI outputs (prompt summary + provider + generated time + output/log path)
- what core experience was improved today (not just asset count)

This keeps your submission traceable and reduces disqualification risk.
