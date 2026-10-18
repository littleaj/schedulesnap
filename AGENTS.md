# AGENTS.md

This repository is a small Vite + React + TypeScript application for ScheduleSnap. Keep changes focused, readable, and aligned with the existing frontend patterns.

## Project context

- App entry: `src/main.tsx` and `src/App.tsx`
- Documentation: [README.md](README.md)

## Working conventions

- Prefer small, clear React components. One component per file. For more complex components, consider breaking them down into smaller, reusable pieces.
- Favor composition over inheritance when structuring components.
- Keep logic close to the component or feature that owns it.
- Preserve TypeScript correctness and avoid unnecessary dependencies.
- When adding UI behavior, keep the UX simple and testable.
- Work in small increments: one component or at most two related components per step. Keep scope narrow, avoid unrelated refactors, and stop for review before continuing.
- Follow Atomic Design principles, keeping components under `/components/atoms`, `/components/molecules`, `/components/organisms`, `/components/templates`, `/components/pages`.
- When summarizing changes, provide clear and concise explanations. Sacrifice grammar for the sake of concision.

### CSS
- For most things, use relative units. Use absolute units for borders.
- Use BEM (Block Element Modifier) methodology for naming CSS classes to maintain consistency and readability.

## Validation

- Install dependencies with `npm install` when needed.
- Before claiming success, report the actual command and outcome, and run the entire test suite.
- For production readiness, run `npm run build`.

## TDD and BDD requirements

- Write failing tests before implementing behavior changes.
- For bug fixes, first add a regression test that captures the broken behavior.
- For user-facing features, write BDD-style scenarios using Given/When/Then language or clear scenario names.
- Tests should validate observable behavior, not implementation details.
- Keep tests focused and deterministic.
- Refactor only after the relevant test is green.
- If the project does not yet have a test harness, add the minimum setup needed to support TDD for the feature being changed.
- Do not skip the red-to-green cycle: implement the failing test, then fix the code, then re-run the relevant test.

## Primary workflow

1. Identify the user-visible behavior.
2. Write the failing test or BDD scenario.
3. Run the targeted test or validation command.
4. Implement the minimal fix.
5. Re-run the focused validation, iterating until it passes.
6. Then, run the entire test suite, iterating until it passes.
7. Make a commit with a clear message summarizing the change.
8. Review and analyze the changes and consider refactoring opportunities.
9. Refactor the code as needed, ensuring that all tests continue to pass.
10. Make a commit after each refactoring step.
11. Repeat the cycle for the next change, maintaining small, focused increments.

## Avoid

- Making speculative changes without a failing test.
- Testing implementation details instead of user outcomes.
- Adding broad refactors alongside a focused fix.
- Claiming completion without fresh verification output.
