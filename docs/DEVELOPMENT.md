# Development guide

## Setup

Use Node.js 22.18.0 (pinned in `.nvmrc`), then install dependencies and configure Firebase environment variables:

```sh
pnpm install
```

Create a local `.env` file containing the `VITE_FIREBASE_*` values required by `src/lib/config/firebase.ts`. Keep it untracked.

To use quotation creation, also configure `VITE_EQUIPMENT_CATALOGUE_URL` with the approved read-only Insense Packages feed. The feed must return the contract described in [the quotation plan](quotation-and-lead-management-plan.md); no catalogue records should be copied into Firestore.

The application is currently owner-only. The Firebase user profile for the active owner must have `isAdmin: true`; newly created profiles default to `false`.

Start the development server with:

```sh
pnpm dev
```

## Verification

Run the checks relevant to the change:

```sh
pnpm check
pnpm build
pnpm test:server -- --run
pnpm test:client -- --run
pnpm test:e2e
pnpm lint
```

`test:client` uses Vitest's Playwright browser provider. In restricted environments it may fail before running tests because the browser server cannot bind to localhost; record that limitation rather than treating it as a passing browser suite.

## Change workflow

1. Read the current architecture and the relevant route, state, schema, and utility files.
2. Make the smallest scoped change that preserves the existing V2 patterns.
3. Run `pnpm check` after Svelte or TypeScript changes.
4. Run the relevant tests and a production build for changes affecting routes, Firebase data, or document generation.
5. Update active documentation when behavior, routes, data models, or verification status changes.

## Documentation workflow

- Keep current guidance in `README.md`, `docs/ARCHITECTURE.md`, and this file.
- Keep the dated codebase review as the active cleanup backlog until its findings are resolved.
- Move completed plans and superseded reports to `docs/archive/`.
- Keep contract placeholder references in `docs/reference/`.
- Do not commit generated test output, check logs, credentials, or temporary planning files.
