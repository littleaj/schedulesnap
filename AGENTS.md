# AGENTS.md

This repository is a small Vite + React + TypeScript application for ScheduleSnap. Keep changes focused, readable, and aligned with the existing frontend patterns.

## Project context

- App entry: `src/main.tsx` and `src/App.tsx`
- Styling lives in `src/App.css` and `src/index.css`
- Documentation: [README.md](README.md)
- Local scripts: `npm run dev`, `npm run build`

## Working conventions

- Prefer small, clear React components over large, deeply nested UI trees. One component per file.
- Keep logic close to the component or feature that owns it.
- Preserve TypeScript correctness and avoid unnecessary dependencies.
- When adding UI behavior, keep the UX simple and testable.
- Work in small increments: one component or at most two related components per step. Keep scope narrow, avoid unrelated refactors, and stop for review before continuing.
- Follow Atomic Design principles, keeping components under `/components/atoms`, `/components/molecules`, `/components/organisms`, `/components/templates`, `/components/pages`.

### CSS
- For most things, use relative units. Use absolute units for borders.

## Validation workflow

- Install dependencies with `npm install` when needed.
- Run the smallest relevant command to verify the change.
- Before claiming success, report the actual command and outcome.
- For production readiness, run `npm run build` when the change affects the app as a whole.

## TDD and BDD requirements

- Write failing tests before implementing behavior changes.
- For bug fixes, first add a regression test that captures the broken behavior.
- For user-facing features, write BDD-style scenarios using Given/When/Then language or clear scenario names.
- Tests should validate observable behavior, not implementation details.
- Keep tests focused and deterministic.
- Refactor only after the relevant test is green.
- If the project does not yet have a test harness, add the minimum setup needed to support TDD for the feature being changed.
- Do not skip the red-to-green cycle: implement the failing test, then fix the code, then re-run the relevant test.

## Practical workflow

1. Identify the user-visible behavior.
2. Write the failing test or BDD scenario.
3. Run the targeted test or validation command.
4. Implement the minimal fix.
5. Re-run the focused validation.
6. Only then widen validation if the change affects broader behavior.

## Avoid

- Making speculative changes without a failing test.
- Testing implementation details instead of user outcomes.
- Adding broad refactors alongside a focused fix.
- Claiming completion without fresh verification output.
