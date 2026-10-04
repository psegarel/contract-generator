# Contract Generator

Contract Generator is a SvelteKit/Svelte 5 application for creating bilingual English/Vietnamese contracts and exporting them as DOCX or HTML documents.

## Current capabilities

- Service provision, event planning, equipment rental, one-off rental, and DJ residency contracts
- Client and contractor counterparties
- Events and payment tracking
- Client quotations and Firestore lead tracking
- Quotation PDF downloads with equipment snapshots and thumbnails
- Firebase Authentication, Firestore, and Storage integration
- Shared Svelte form and design-system components

## Local development

Requirements: Node.js 22.18.0 and pnpm. The repository pins Node in `.nvmrc`; NVM-enabled shells select it automatically when opened in the project.

```sh
pnpm install
pnpm dev
```

Configure the `VITE_FIREBASE_*` variables in a local `.env` file before using Firebase-backed features. Do not commit local credentials.

Quotation creation also requires `VITE_EQUIPMENT_CATALOGUE_URL`, pointing to the protected `/api/quotation-catalogue` feed from Insense Packages. Contract Generator forwards the signed-in Firebase ID token; it validates the feed but never connects directly to Neon.

## Verification commands

```sh
pnpm check                 # Svelte and TypeScript diagnostics
pnpm build                 # Production build
pnpm test:server -- --run  # Node-side tests
pnpm test:client -- --run  # Browser component tests
pnpm test:e2e              # Playwright end-to-end tests
pnpm lint                  # Prettier check and ESLint
```

## Main routes

- `/` — dashboard
- `/contracts/...` — contract creation, lists, previews, and editing
- `/counterparties/...` — client and contractor management
- `/events/...` — event management
- `/payments` — payment management
- `/quotations/...` — quotation creation, tracking, and PDF downloads
- `/leads` — Firestore lead pipeline
- `/login` — authentication

## Documentation

Start with the [documentation index](docs/README.md), then read:

- [Architecture](docs/ARCHITECTURE.md) — current application structure and data model
- [Development guide](docs/DEVELOPMENT.md) — workflows, checks, and documentation conventions
- [Codebase review](docs/CODEBASE_REVIEW_2026-09-22.md) — current cleanup findings and priorities
- [Contract template references](docs/reference/) — active placeholder documentation
- [Agent guidelines](CLAUDE.md) — instructions for AI agents working in this repository

Completed plans and superseded project notes are preserved in [docs/archive](docs/archive/).

## Project layout

```text
src/routes/                 SvelteKit routes
src/lib/components/         Shared UI and form components
src/lib/state/               Svelte 5 state classes
src/lib/types/               TypeScript domain models
src/lib/schemas/             Zod validation schemas
src/lib/utils/               Firebase, document, and business utilities
static/                      DOCX templates and public assets
firestore.rules              Firestore authorization rules
storage.rules                Firebase Storage authorization rules
```
