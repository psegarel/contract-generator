# Architecture

## Technology

- SvelteKit with Svelte 5 runes and TypeScript
- Tailwind CSS and bits-ui primitives
- Firebase Authentication, Firestore, and Storage
- Zod schemas for validation
- `docx`, Docxtemplater, and PizZip for DOCX generation
- HTML previews for supported contract types

## Domain model

The V2 model separates the main business entities:

- **Counterparty** — a client or contractor, with subtype-specific fields for performers and service providers
- **Event** — an event that can group related contracts
- **Contract** — a typed contract stored in its own Firestore collection
- **Payment** — payment records associated with contracts

All contract interfaces extend `BaseContract` for shared list and payment fields. The supported contract discriminators are:

`venue-rental`, `performer-booking`, `equipment-rental`, `equipment-rental-oneoff`, `service-provision`, `event-planning`, `subcontractor`, `client-service`, and `dj-residency`.

Four contract types currently have backend types, schemas, utilities, and state but no dedicated creation UI: venue rental, performer booking, subcontractor, and client service. Their roadmap status is documented in the [codebase review](CODEBASE_REVIEW_2026-09-22.md).

## Application structure

```text
src/routes/                 Route pages and route data loaders
src/lib/components/         Shared UI, forms, previews, and layout components
src/lib/state/              Svelte 5 state classes and form state
src/lib/types/              TypeScript domain models
src/lib/schemas/            Zod validation schemas
src/lib/utils/              Firebase CRUD, document generation, and business logic
src/lib/config/             Firebase and application configuration
static/                     DOCX templates and public assets
```

## Persistence

The principal Firestore collections include:

- `users`
- `counterparties`
- `events`
- `payments`
- `service-provision-contracts`
- `event-planning-contracts`
- `equipment-rental-contracts`
- `equipment-rental-oneoff-contracts`
- `dj-residency-contracts`

Legacy collections and migration scripts remain in the repository for historical reference. They should not be treated as the active application architecture.

## Authorization

This is currently a single-owner application. The account whose `users/{uid}` profile has `isAdmin: true` is the only account allowed to read or modify application data and uploaded counterparty documents. Firebase authentication alone is not sufficient for application access.

New user profiles default to `isAdmin: false`. If the owner account is newly provisioned, set its profile flag manually in Firestore or through a trusted administrative process before using the application. The rules are defined in [firestore.rules](../firestore.rules) and [storage.rules](../storage.rules).
