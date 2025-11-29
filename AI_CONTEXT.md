# Project Context: Contract Generator

## Project Overview
**Contract Generator** is a web application designed to create professional, bilingual (English & Vietnamese) service contracts. It simplifies the legal process for freelancers and businesses by generating Word documents (`.docx`) from user input.

## Technology Stack
- **Framework:** [SvelteKit](https://kit.svelte.dev/) (Svelte 5)
- **Styling:** [TailwindCSS](https://tailwindcss.com/)
- **Authentication:** [Firebase Auth](https://firebase.google.com/docs/auth)
- **State Management:** Svelte 5 Runes (`$state`, `$derived`)
- **Document Generation:** `docx`, `docxtemplater`, `pizzip`
- **Package Manager:** [pnpm](https://pnpm.io/)
- **Testing:**
    - **Unit:** [Vitest](https://vitest.dev/)
    - **E2E:** [Playwright](https://playwright.dev/)

## Key Features
- **Landing Page:** Professional introduction to the service.
- **Authentication:** Secure login/signup flow using Firebase.
- **Contract Generation:** Protected route (`/service-contract`) to input details and download generated contracts.
- **Bilingual Support:** Contracts are generated in both English and Vietnamese.

## Recent Updates

### UI Redesign with shadcn-svelte & Theme Support

**shadcn-svelte Integration:**
- Installed and configured [shadcn-svelte](https://www.shadcn-svelte.com/) for a minimalist, accessible component system
- Added UI components: Button, Input, Label, Textarea, Select, Card, Alert, Separator
- Uses `bits-ui` as the headless component foundation
- Styled with TailwindCSS 4 and design tokens

**Theme Toggler:**
- **[theme.svelte.ts](file:///Users/mac/Documents/WebDev/contract-generator/src/lib/stores/theme.svelte.ts)**: Theme store using Svelte 5 runes
  - Supports light/dark mode toggle
  - Persists theme preference in localStorage
  - Respects system preference on initial load
  - Applies theme via `.dark` class on `<html>` element

### Firestore Integration - Client Profiles

**Database Setup:**
- Connected to Firestore with a `clients` collection
- **[firebase.ts](file:///Users/mac/Documents/WebDev/contract-generator/src/lib/config/firebase.ts)**: Firebase app initialization with Firestore SDK
- **[clients.ts](file:///Users/mac/Documents/WebDev/contract-generator/src/lib/utils/clients.ts)**: Client data utilities with Zod validation

**Client Management Features:**
- `listClients(ownerUid)`: Returns minimal client list for dropdown selection
- `getClient(ownerUid, id)`: Fetches full client profile with validation
- `upsertClient(ownerUid, data, id?)`: Creates or updates client profiles
- All read/write operations validated with Zod schema
- Client data scoped to authenticated user (`ownerUid`)

**Data Model:**
```typescript
{
  ownerUid: string,        // User who owns this client
  name: string,
  phone: string,
  address: string,
  taxId: string | null,
  bankName: string,
  accountNumber: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Form Integration:**
- **[ContractForm.svelte](file:///Users/mac/Documents/WebDev/contract-generator/src/lib/components/ContractForm.svelte)**:
  - Client selector dropdown loads saved clients on mount
  - Auto-populates form fields when client selected
  - "Save Client" button creates/updates client profiles
  - Integrates with authentication store for user context

### Walkthrough - Added Unit & E2E Tests

I have successfully added unit tests for the `AuthStore` and E2E tests for the critical navigation and authentication flows.

#### Changes

**Unit Tests**
- **[auth.svelte.test.ts](file:///Users/mac/Documents/WebDev/contract-generator/src/lib/stores/auth.svelte.test.ts)**: Added comprehensive tests for the `AuthStore` singleton.
    - Verified initialization state.
    - Verified state updates on login/logout using mocked Firebase Auth.
    - Refactored `AuthStore` to export the class for better testability.

**E2E Tests**
- **[navigation.e2e.spec.ts](file:///Users/mac/Documents/WebDev/contract-generator/src/e2e/navigation.e2e.spec.ts)**:
    - Verified landing page loads correctly.
    - Verified navigation to the Login page.
    - Verified redirection from protected routes (`/service-contract`) to login.
- **[auth.e2e.spec.ts](file:///Users/mac/Documents/WebDev/contract-generator/src/e2e/auth.e2e.spec.ts)**:
    - Verified Login form elements are visible.

**Configuration**
- **[vite.config.ts](file:///Users/mac/Documents/WebDev/contract-generator/vite.config.ts)**: Updated to exclude E2E tests from unit test runs.
- **[playwright.config.ts](file:///Users/mac/Documents/WebDev/contract-generator/playwright.config.ts)**: Added Playwright configuration.
- **[package.json](file:///Users/mac/Documents/WebDev/contract-generator/package.json)**: Added `test:e2e` script and updated `test` script to run both.

#### Verification Results

**Automated Tests**
Ran `pnpm test` which executes both unit and E2E tests.

```bash
> contract-generator@0.0.1 test:unit
> vitest --run

 ✓  server  src/demo.spec.ts (1 test)
 ✓  client (chromium)  src/lib/stores/auth.svelte.test.ts (3 tests)
 ✓  client (chromium)  src/routes/page.svelte.spec.ts (1 test)
                                                         
 Test Files  3 passed (3)
      Tests  5 passed (5)

> contract-generator@0.0.1 test:e2e
> playwright test

Running 4 tests using 4 workers
  4 passed (3.5s)
```
