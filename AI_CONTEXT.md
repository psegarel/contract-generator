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

## Planned Features

### Document Upload for Client ID Documents

**Objective:** Add ability to upload and store client ID documents (e.g., passport, ID card - front/back)

**Implementation Plan:**

1. **Firebase Storage Integration:**
   - Enable Firebase Storage in Firebase Console
   - Add Firebase Storage SDK to project
   - Configure storage security rules

2. **Storage Structure:**
   ```
   /client-documents/
     /{clientId}/
       /id-front.{jpg|png|pdf}
       /id-back.{jpg|png|pdf}
   ```

3. **Data Model Changes:**
   ```typescript
   ClientData {
     // ... existing fields
     documents?: {
       front?: {
         url: string;        // Firebase Storage download URL
         fileName: string;
         uploadedAt: Timestamp;
         uploadedBy: string; // User UID who uploaded
         size: number;       // File size in bytes
       };
       back?: {
         url: string;
         fileName: string;
         uploadedAt: Timestamp;
         uploadedBy: string;
         size: number;
       };
     }
   }
   ```

4. **UI Components:**
   - File upload input in ClientForm (drag & drop or click)
   - Image/PDF preview
   - Delete/replace functionality
   - Upload progress indicator
   - File validation (type, size)

5. **Constraints:**
   - Maximum 2 documents per client
   - Allowed file types: JPG, PNG, PDF
   - Maximum file size: 5MB per document
   - Only authenticated users can upload/delete

6. **Storage Security Rules:**
   ```
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /client-documents/{clientId}/{fileName} {
         allow read: if request.auth != null;
         allow write: if request.auth != null
           && request.resource.size < 5 * 1024 * 1024  // 5MB limit
           && request.resource.contentType.matches('image/.*|application/pdf');
         allow delete: if request.auth != null;
       }
     }
   }
   ```

7. **Additional Considerations:**
   - Handle file deletion when client is deleted
   - Add loading states during upload
   - Error handling for upload failures
   - Compress images before upload (optional optimization)

## Recent Updates

### Team-Shared Application (2025-12-02)

**Migration to Shared Internal Application:**

- Converted from user-owned data model to team-shared model for internal collaboration
- All authenticated users can now view and edit all contacts and contracts
- **[firestore.rules](file:///Users/mac/Documents/WebDev/contract-generator/firestore.rules)**: Updated security rules
  - Removed owner-only access restrictions
  - Any authenticated user can read/write clients and contracts
  - Removed unused `isOwner()` function
- **[clients.ts](file:///Users/mac/Documents/WebDev/contract-generator/src/lib/utils/clients.ts)**: Updated client utilities
  - `listClients()`: No longer filters by ownerUid
  - `getClient(id)`: Removed ownership verification
  - `deleteClient(id)`: Removed ownership verification
  - Duplicate checking now global across all team members
- **[contracts.ts](file:///Users/mac/Documents/WebDev/contract-generator/src/lib/utils/contracts.ts)**: Updated contract utilities
  - `getUserContracts()` renamed to `getAllContracts()`
  - `getContract(id)`: Removed ownership verification
  - `updateContract(id, data)`: Removed ownership verification
- Updated all components to use new shared data model
- Still stores `ownerUid` for audit trail purposes
- Net code reduction: 40 lines removed (simplified architecture)

**Benefits:**
- No duplicate contacts across team members
- Full transparency of all contracts
- Simplified codebase
- Better suited for internal team collaboration

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

**Mobile-Responsive Navigation:**

- **[Header.svelte](file:///Users/mac/Documents/WebDev/contract-generator/src/lib/components/Header.svelte)**: Responsive header with hamburger menu
  - Desktop: Horizontal navigation with inline items (≥ md breakpoint)
  - Mobile: Collapsible hamburger menu (< md breakpoint)
  - Theme toggle accessible on all screen sizes
  - Auto-closes menu on navigation for better UX
  - Touch-friendly targets and smooth transitions

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
  email: string,           // Required, unique per owner
  phone: string,
  address: string,
  idDocument: string,      // ID Card / Passport Number, unique per owner
  taxId: string | null,    // Optional tax ID
  bankName: string,
  accountNumber: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Uniqueness Validation:**

- Email addresses are normalized (lowercase, trimmed) and enforced as unique per owner
- ID documents are normalized (uppercase, trimmed) and enforced as unique per owner
- Validation happens client-side before writes with helpful error messages
- Firestore security rules provide server-side validation for all required fields

**Reusable Components:**

- **[ClientForm.svelte](file:///Users/mac/Documents/WebDev/contract-generator/src/lib/components/ClientForm.svelte)**: Reusable client management component
  - Client selector dropdown with auto-population
  - All client fields (name, email, phone, address, ID document, tax ID, bank details)
  - Required field validation with HTML5 form validation
  - Optional save/delete actions via `showActions` prop
  - Emits `onClientChange` callback for parent components
  - Used in both `/clients` route and contract form

**Routes:**

- **[/clients](file:///Users/mac/Documents/WebDev/contract-generator/src/routes/clients/+page.svelte)**: Standalone client management page
  - Add/edit/delete client profiles independently
  - Duplicate prevention for email and ID document fields
  - Protected route (requires authentication)
  - Accessible via header navigation

- **[/login](file:///Users/mac/Documents/WebDev/contract-generator/src/routes/login/+page.svelte)**: Login page
  - Redirects to `/contracts` if user is already authenticated
  - Prevents authenticated users from accessing login page

- **[ContractForm.svelte](file:///Users/mac/Documents/WebDev/contract-generator/src/lib/components/ContractForm.svelte)**:
  - Integrates `ClientForm` component
  - Client data syncs with contract form fields
  - Streamlined client selection for contracts

## Coding Guidelines

**CRITICAL: Read and follow these guidelines strictly to avoid introducing bugs.**

### Svelte 5 Reactivity - Understanding $effect vs onMount

**When to use `$effect()`:**
- When you need to react to changes in reactive state
- When dealing with authentication state that loads asynchronously
- When you need to re-run logic whenever dependencies change
- Example: Fetching data based on `authStore.user?.uid`

**When to use `onMount()`:**
- For one-time initialization that doesn't depend on reactive state
- For setting up event listeners or subscriptions
- For operations that should only run once when component mounts
- Example: Initializing a map, starting an animation

**Common Pitfall - Authentication Timing:**
```typescript
// ❌ BAD - onMount runs once, may miss auth state
onMount(async () => {
  if (!authStore.user?.uid) return; // Auth might not be ready yet!
  const data = await fetchData(authStore.user.uid);
});

// ✅ GOOD - $effect reacts to auth changes
$effect(() => {
  const userId = authStore.user?.uid;
  if (!userId) return;

  fetchData(userId).then(data => {
    // Handle data
  });
});
```

### Testing Requirements

**MANDATORY: Run ALL checks before committing:**

1. **Type checking:**
   ```bash
   pnpm check
   ```
   - Must pass with zero TypeScript errors
   - Fix all type issues before proceeding

2. **Unit tests:**
   ```bash
   pnpm test:unit -- --run
   ```
   - Must pass all tests
   - Add tests for new features and bug fixes

3. **E2E tests:**
   ```bash
   pnpm test:e2e
   ```
   - Must pass all tests
   - Verify critical user flows still work

4. **Full test suite (recommended):**
   ```bash
   pnpm test
   ```
   - Runs type check, unit tests, and e2e tests
   - Use this before committing

5. **Browser testing:**
   - Manually verify functionality works as expected
   - Check browser console for errors
   - Test both authenticated and unauthenticated states
   - Test on different screen sizes (mobile, tablet, desktop)

6. **Write tests for changes:**
   - Unit tests for utilities and stores
   - Component tests for UI interactions
   - E2E tests for critical user flows
   - Mock external dependencies (Firestore, Auth)

### Code Quality Standards

1. **Don't break working code:**
   - If something works, don't refactor it without a good reason
   - Understand the code before changing it
   - Consider edge cases (auth timing, loading states, error states)

2. **Be explicit about async operations:**
   - Always handle loading states
   - Always handle error states
   - Consider race conditions
   - Don't assume auth is ready on mount

3. **Follow the principle of least surprise:**
   - Don't change behavior unexpectedly
   - Keep UI/UX consistent
   - Maintain existing patterns

4. **Type safety:**
   - Use TypeScript strictly
   - Don't use `any` unless absolutely necessary
   - Validate data with Zod schemas

### Debugging Workflow

When investigating bugs:
1. Add diagnostic logging to identify the issue
2. Verify assumptions with console.log or debugger
3. Test in the browser to see actual behavior
4. Remove diagnostic logging after fixing
5. Verify the fix works before committing

### Latest Session Summary (2025-11-30 - Evening)

**Bug Fix - Contract History Auth Timing Issue:**

**Problem:**
- Contract history page showed "No contracts found" even when contracts existed in database
- Tests were passing but didn't catch the real-world bug
- Issue was introduced in a previous session

**Root Cause:**
- Page used `onMount()` which runs once when component loads
- Firebase authentication hadn't completed when component mounted
- `authStore.user` was `null`, so contract fetch was skipped
- Component never retried even after user became authenticated

**Solution:**
- Replaced `onMount()` with `$effect()` in [/contracts/history](file:///Users/mac/Documents/WebDev/contract-generator/src/routes/contracts/history/+page.svelte)
- `$effect()` reactively watches `authStore.user?.uid`
- Automatically fetches contracts when user becomes authenticated
- Properly handles loading and error states

**Files Changed:**
- **[+page.svelte](file:///Users/mac/Documents/WebDev/contract-generator/src/routes/contracts/history/+page.svelte)**: Fixed auth timing with $effect
- **[contracts.test.ts](file:///Users/mac/Documents/WebDev/contract-generator/src/lib/utils/contracts.test.ts)**: Added unit tests with proper mocking
- **[+layout.svelte](file:///Users/mac/Documents/WebDev/contract-generator/src/routes/+layout.svelte)**: Updated Toaster position to top-center

**Key Learnings:**
- Always consider authentication timing in protected routes
- Use `$effect()` for reactive data fetching based on auth state
- Write tests but also verify in browser (mocked tests can miss timing issues)
- This bug demonstrates why the coding guidelines above are critical

### Latest Session Summary (2025-11-30 - Afternoon)

**Navigation Redesign - User Menu with Dropdown:**

- Replaced navbar icon, email, and logout button with user avatar dropdown menu
- Installed shadcn-svelte `dropdown-menu` and `avatar` components
- User menu shows:
  - Avatar with user initials (generated from email)
  - Email address at top
  - Contacts menu item
  - Contracts submenu (Service Contract, Contract History, Templates)
  - Sign Out option
- Removed separate mobile menu implementation
- Single responsive dropdown works across all screen sizes
- Moved service contract route from `/service-contract` to `/contracts/service-contract`
- Updated all route references and tests
- Fixed menu alignment issues (consistent `gap-2` spacing)

**Contract History Feature:**

- **[contracts.ts](file:///Users/mac/Documents/WebDev/contract-generator/src/lib/utils/contracts.ts)**: Contract storage utilities
  - `saveContract(ownerUid, type, contractData, contractNumber)`: Saves contracts to Firestore
  - `getUserContracts(ownerUid)`: Retrieves all user contracts ordered by creation date
  - Uses `ownerUid` for consistency with clients collection
- **[/contracts/history](file:///Users/mac/Documents/WebDev/contract-generator/src/routes/contracts/history/+page.svelte)**: Contract history page
  - Lists all previously generated contracts
  - Shows contract number, client name, job name, creation date
  - Download button to regenerate and download any contract
  - Empty state with helpful messaging
- **Auto-save on Generation**: Contracts automatically saved when generated
  - Unique contract number format: `YYYYMMDD-INITIALS-TIMESTAMP`
  - Saves full contract data with metadata
  - Continues download even if save fails
- **Firestore Setup**:
  - Added `contracts` collection security rules
  - Created composite index (ownerUid + createdAt DESC)
  - Deployed rules and indexes via Firebase CLI
  - Added Firebase config files (firebase.json, .firebaserc)
  - Installed firebase-tools as dev dependency

**Terminology Update - Clients to Contacts:**

- Renamed "Clients" to "Contacts" throughout app
- Route changed from `/clients` to `/contacts`
- Updated navigation menu and page titles
- Description clarifies: "manage clients and service providers"
- ContractForm section: "Contact Information"
- Reflects multiple contract types:
  - AV Equipment Rental (clients)
  - Event Consulting/Promotion (clients)
  - Service Contracts (service providers)

**Data Models:**

Contracts Collection:
```typescript
{
  ownerUid: string,
  type: 'service',
  contractData: ContractData,  // Full form data
  contractNumber: string,       // e.g., "20251130-PS-123"
  createdAt: Timestamp
}
```

**Routes:**

- **[/contacts](file:///Users/mac/Documents/WebDev/contract-generator/src/routes/contacts/+page.svelte)**: Contact management (renamed from /clients)
- **[/contracts](file:///Users/mac/Documents/WebDev/contract-generator/src/routes/contracts/+page.svelte)**: Contract templates selection
- **[/contracts/service-contract](file:///Users/mac/Documents/WebDev/contract-generator/src/routes/contracts/service-contract/+page.svelte)**: Service contract form (moved from /service-contract)
- **[/contracts/history](file:///Users/mac/Documents/WebDev/contract-generator/src/routes/contracts/history/+page.svelte)**: View and download past contracts

### Previous Session Summary (2025-11-29)

**Firestore Client Management Implementation:**

- Added comprehensive client CRUD operations with Firestore integration
- Implemented email and ID document fields with uniqueness validation
- Created reusable `ClientForm` component for DRY principles
- Added dedicated `/clients` route for standalone client management
- Normalized data: email (lowercase), ID document (uppercase)
- Client-side duplicate detection with clear error messages
- Updated Firestore security rules for new required fields
- Fixed login page redirect when already authenticated
- Improved mobile navigation with responsive hamburger menu

**Key Features:**

- Full client management system with duplicate prevention
- Reusable components across app (clients page + contract form)
- Mobile-first responsive design
- Type-safe with Zod validation throughout

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
