# AGENTS Guide

Guidance for coding agents working in `frontend_v2`.
Prefer existing patterns over new abstractions.

## Project Snapshot
- Stack: Vite + React (JavaScript) + Tauri v2 (Rust shell).
- Frontend code: `src/`.
- Desktop shell code: `src-tauri/`.
- Package manager: `npm` (`package-lock.json` is source of truth).
- JS module system: ESM (`"type": "module"`).

## Primary Config Files
- `package.json` for scripts/dependencies.
- `eslint.config.js` for lint rules.
- `vite.config.js` for dev server/build behavior.
- `src-tauri/tauri.conf.json` for app/window/build config.
- `src-tauri/Cargo.toml` for Rust dependencies/build.

## Cursor / Copilot Rules
- No `.cursorrules` found.
- No `.cursor/rules/` directory found.
- No `.github/copilot-instructions.md` found.
- If those files appear later, treat them as higher-priority instructions.

## Setup Commands
- Install JS deps: `npm install`
- Optional Rust prefetch: `cargo fetch --manifest-path src-tauri/Cargo.toml`

## Build / Lint / Run Commands

### Frontend
- Dev server: `npm run dev`
- Production build: `npm run build`
- Build preview: `npm run preview`
- Lint: `npm run lint`

### Tauri
- Tauri CLI passthrough: `npm run tauri`
- Desktop dev: `npm run tauri:dev`
- Desktop build: `npm run tauri:build`
- Desktop debug build: `npm run tauri:build -- --debug`

### Rust-only (optional)
- Check crate: `cargo check --manifest-path src-tauri/Cargo.toml`
- Build crate: `cargo build --manifest-path src-tauri/Cargo.toml`

## Test Commands (Including Single Test)
- JS all tests: `npm run test:run`
- JS watch mode: `npm run test`
- Single JS test file:
  - `npx vitest run src/App.test.jsx`
- Single JS test by name pattern:
  - `npx vitest run -t "renders minimarket login form"`
- Test bootstrap file:
  - `src/test/setup.js` (includes baseline mocks for `@tauri-apps/api/*`)
- Access mocks in tests via:
  - `globalThis.__TAURI_MOCKS__`
- Rust all tests: `cargo test --manifest-path src-tauri/Cargo.toml`
- Single Rust test (exact):
  - `cargo test --manifest-path src-tauri/Cargo.toml test_name_here -- --exact`
- Rust tests by substring:
  - `cargo test --manifest-path src-tauri/Cargo.toml partial_name`

## JavaScript / React Style
- Use functional components.
- Keep components focused and small; extract helpers for complex UI logic.
- Use `.jsx` for React component files.
- Use 2-space indentation.
- Prefer single quotes in JS.
- Keep semicolonless style unless a file already uses semicolons consistently.
- Keep trailing commas in multiline literals when existing style uses them.
- Prefer early returns to reduce nested conditions.
- Keep render paths resilient; avoid throwing from render.

## Imports and File Organization
- Import order:
  1) third-party packages,
  2) local CSS,
  3) local modules/components.
- Use one blank line between import groups.
- Use relative imports inside `src/` (no path alias configured).
- Remove dead imports/variables (`no-unused-vars` is enforced).

## Naming Conventions
- React components: `PascalCase` (`App`, `LoginPanel`).
- Variables/functions: `camelCase`.
- Constants: `UPPER_SNAKE_CASE` only for true constants.
- CSS classes: kebab-case (`window-titlebar`, `action-buttons`).
- Reusable component files: `PascalCase.jsx`.
- Entry files can stay lowercase when conventional (`main.jsx`).

## CSS Guidelines
- Keep styles near the component they belong to when possible.
- Prefer descriptive class names instead of deep selector chains.
- Preserve current visual language unless redesign is requested.
- Keep responsive behavior explicit with media queries.
- Use CSS variables for repeated values before introducing utility frameworks.

## Types and Data Handling
- Codebase is JavaScript-first, not TypeScript.
- Do not migrate to TypeScript unless explicitly requested.
- Add runtime guards/default values for uncertain data shapes.
- Validate nullable/optional values before use in UI and command payloads.

## Error Handling

### Frontend
- Guard event handlers from invalid input/state.
- Show graceful fallback UI instead of crashing.
- Log actionable errors in development; avoid noisy production logs.

### Rust / Tauri
- Prefer `Result` propagation with clear context.
- Avoid `unwrap()` in runtime code paths.
- Use `.expect(...)` only for unrecoverable startup/setup failures.

## Lint and Quality Expectations
- ESLint extends: `@eslint/js` + React Hooks + React Refresh.
- `dist/` is ignored by lint config.
- Run `npm run lint` before finishing substantial changes.
- Run `npm run build` for frontend-impacting changes.
- Run `npm run tauri:build -- --debug` for desktop-impacting changes.

## Tauri-Specific Notes
- Keep `identifier` in `tauri.conf.json` globally unique.
- `beforeDevCommand` and `beforeBuildCommand` use npm scripts.
- Frontend output for Tauri is `../dist` from `src-tauri/`.
- Vite watch excludes `src-tauri/**` to reduce unnecessary reloads.

## Files/Dirs to Avoid Editing Blindly
- `dist/` (generated frontend output).
- `src-tauri/target/` (generated Rust build output).
- `src-tauri/icons/` (binary/icon assets).

## Change Management Rules
- Keep diffs minimal and task-focused.
- Do not reformat unrelated files.
- Do not add dependencies unless needed for the request.
- If dependencies/tooling change, update this file.
- If tests are introduced, document how to run one test by name/path.

## Pre-PR Checklist
- `npm run lint` passes.
- `npm run build` passes.
- If desktop behavior changed, `npm run tauri:build -- --debug` passes.
- Confirm no generated artifacts were accidentally committed.
- Confirm AGENTS guidance is still accurate after your changes.
