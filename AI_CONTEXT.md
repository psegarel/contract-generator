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

> **Note:** Document upload for client ID documents has been implemented. See "Document Upload Implementation" in Recent Updates.

### Contract Version History & Rollback

**Objective:** Track contract changes and enable rollback to previous versions for mistake recovery

**Why This is Needed:**
- Multiple team members can edit the same contract
- Need ability to see who changed what and when
- Ability to restore previous versions if mistakes are made
- Audit trail for important contract modifications

**Implementation Plan:**

1. **Data Structure:**
   ```typescript
   // Main contract document (contracts/{contractId})
   Contract {
     // ... existing fields
     currentVersion: number;
     lastModifiedBy: string;
     lastModifiedAt: Timestamp;
   }

   // Version history subcollection (contracts/{contractId}/versions/{versionId})
   ContractVersion {
     versionNumber: number;
     contractData: ContractData;  // Full snapshot
     modifiedBy: string;           // User UID
     modifiedByEmail: string;      // For display
     modifiedAt: Timestamp;
     changeDescription?: string;   // Optional user note
     previousVersion?: number;     // Link to previous version
     isImportant?: boolean;        // Tagged to prevent auto-cleanup
     taggedBy?: string;            // User who tagged it as important
   }
   ```

2. **Versioning Strategy:**
   - **Auto-versioning:** Create new version on every update
   - **Manual versioning:** User decides when to create a version (with description)
   - **Hybrid:** Auto-save on update + manual snapshots with descriptions

3. **UI Components:**
   - Version history panel in contract edit view
   - Timeline showing all versions with:
     - Version number
     - Timestamp
     - Who made the change
     - Optional change description
   - "View" button to see previous version (read-only)
   - "Restore" button to rollback to a version
   - Diff view to compare versions (optional enhancement)

4. **Version Management & Cleanup:**

   **Retention Policies (choose one or combine):**
   - **Count-based:** Keep only last N versions (e.g., 10-20)
   - **Time-based:** Delete versions older than X days/months (e.g., 90 days)
   - **Hybrid:** Keep last 5 versions + any within 30 days
   - **Selective:** Always keep first version + manually tagged versions

   **Cleanup Strategies:**

   a. **Automatic Cleanup (Client-side):**
   ```typescript
   async function cleanupOldVersions(contractId: string, keepCount: number = 10) {
     const versionsRef = collection(db, `contracts/${contractId}/versions`);
     const q = query(versionsRef, orderBy('versionNumber', 'desc'));
     const snapshot = await getDocs(q);

     // Keep most recent N versions, delete the rest
     const toDelete = snapshot.docs.slice(keepCount);

     for (const doc of toDelete) {
       await deleteDoc(doc.ref);
     }
   }
   ```

   b. **Manual Cleanup (UI):**
   - "Clean up old versions" button in version history panel
   - Show how much storage will be freed
   - Confirmation dialog before deletion
   - Option to select which versions to keep

   c. **Scheduled Cleanup (Cloud Functions - optional):**
   ```typescript
   // Cloud Function runs daily
   export const cleanupOldVersions = onSchedule('every day 02:00', async () => {
     // Find all contracts
     const contracts = await getDocs(collection(db, 'contracts'));

     for (const contract of contracts.docs) {
       // Apply retention policy per contract
       await cleanupVersionsForContract(contract.id, retentionPolicy);
     }
   });
   ```

   **Cleanup Rules:**
   - Never delete the original (first) version
   - Never delete versions tagged as "important" by users
   - Warn user before deleting any version less than 7 days old
   - Cleanup triggered automatically after creating new version
   - Option to disable auto-cleanup per contract (for critical contracts)

   **UI for Cleanup:**
   - Settings page with retention policy configuration
   - Per-contract override for retention
   - Manual cleanup button with preview of what will be deleted
   - Version tagging: mark versions as "important" to prevent deletion
   - Storage usage indicator showing space used by versions

5. **Firestore Structure:**
   ```
   /contracts/
     /{contractId}/
       - contract document (current state)
       /versions/
         /{versionId}/
           - version snapshot
   ```

6. **Security Rules:**
   ```javascript
   match /contracts/{contractId}/versions/{versionId} {
     // Any authenticated user can read versions
     allow read: if isSignedIn();
     // Only system can write (via Cloud Functions or app logic)
     allow create: if isSignedIn();
     // Prevent modification of historical versions
     allow update, delete: if false;
   }
   ```

7. **Key Features:**
   - **View History:** See list of all versions
   - **Compare:** Visual diff between two versions
   - **Restore:** One-click rollback to previous version
   - **Metadata:** Track who, when, and optionally why
   - **Search:** Filter versions by date range or user

8. **Additional Considerations:**
   - Notification when someone else edits a contract you're viewing
   - Lock mechanism to prevent simultaneous edits (optional)
   - Version retention policy (keep versions for X months)
   - Export version history for compliance/audit
   - Performance: Use pagination for contracts with many versions

9. **Implementation Options:**

   **Option A: Client-side versioning**
   - App creates version before updating contract
   - Simpler, no Cloud Functions needed
   - Version created on every save

   **Option B: Cloud Functions**
   - Firestore trigger automatically creates version on update
   - Centralized logic, can't be bypassed
   - More robust but requires Cloud Functions setup

   **Recommended:** Start with Option A, migrate to B if needed

10. **Cost Considerations:**
    - Each version = additional Firestore document (storage cost)
    - Limit versions or archive strategy recommended
    - Example: 100 contracts × 10 versions each = 1000 docs
    - Consider compression for very large contract data

## Recent Updates

### Class-Based Architecture (2025-12-02)

**Migration to OOP Architecture:**

- Refactored utilities from functional exports to class-based architecture for better encapsulation
- Implemented Repository pattern for data access and Manager pattern for operations
- Three core classes created:
  - **ClientDocumentManager** (clientDocuments.ts): Manages document uploads/deletions
  - **ClientRepository** (ClientRepository.ts): Manages client CRUD operations
  - **ContractRepository** (ContractRepository.ts): Manages contract CRUD operations

**Architecture Benefits:**

- **Encapsulation:** Private methods prevent misuse and hide implementation details
- **Configuration:** Static constants for limits and validation rules
- **Separation of Concerns:** Clear boundaries between data access, business logic, and operations
- **Testability:** Classes easier to test with dependency injection
- **Maintainability:** Related functionality grouped together logically

**Implementation Details:**

```typescript
// Repository Pattern Example
export class ClientRepository {
  private static readonly COLLECTION_NAME = 'clients';

  // Public API
  async list(): Promise<Array<{ id: string; name: string }>>
  async getById(id: string): Promise<(ClientData & { id: string }) | null>
  async upsert(ownerUid: string, data: ClientData, id?: string): Promise<string>
  async delete(id: string): Promise<boolean>

  // Private helpers for encapsulation
  private convertTimestamps(documents?: {...}): {...}
  private toDate(timestamp: unknown): Date
  private async checkDuplicates(...): Promise<string | null>
  private normalizeData(data: ClientData): ClientData
}

// Manager Pattern Example
export class ClientDocumentManager {
  private static readonly MAX_FILE_SIZE = 500 * 1024; // 500KB
  private static readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

  constructor(private readonly clientId: string) {}

  async uploadDocument(file: File, imageNumber: 1 | 2, userId: string): Promise<ClientDocument>
  async deleteDocument(imageNumber: 1 | 2): Promise<void>
  async deleteAllDocuments(): Promise<void>

  // Private helpers
  private validateFile(file: File): { valid: boolean; error?: string }
  private getStoragePath(fileName: string): string
}
```

**Backward Compatibility:**

- All existing function exports maintained
- Functions now delegate to repository/manager instances
- Singleton instances created for backward compatibility
- Zero breaking changes to existing code

```typescript
// Legacy function exports still work
const repository = new ClientRepository();

export async function listClients() {
  return repository.list();
}
```

**Files Updated:**

- **[clientDocuments.ts](file:///Users/mac/Documents/WebDev/contract-generator/src/lib/utils/clientDocuments.ts)**: Refactored to ClientDocumentManager class
- **[ClientRepository.ts](file:///Users/mac/Documents/WebDev/contract-generator/src/lib/utils/ClientRepository.ts)**: New repository for client data
- **[clients.ts](file:///Users/mac/Documents/WebDev/contract-generator/src/lib/utils/clients.ts)**: Updated to delegate to ClientRepository
- **[ContractRepository.ts](file:///Users/mac/Documents/WebDev/contract-generator/src/lib/utils/ContractRepository.ts)**: New repository for contract data
- **[contracts.ts](file:///Users/mac/Documents/WebDev/contract-generator/src/lib/utils/contracts.ts)**: Updated to delegate to ContractRepository

### Document Upload Implementation (2025-12-02)

**Client ID Document Upload:**

- ✅ Implemented Firebase Storage integration for client ID documents
- Two documents per client: image 1 and image 2
- File constraints: 500KB max, JPG/PNG/PDF only
- Pre-generated client IDs using `crypto.randomUUID()` for seamless upload workflow

**Storage Structure:**

```
/client-documents/
  /{clientId}/
    /image-1.{jpg|png|pdf}
    /image-2.{jpg|png|pdf}
```

**Data Model:**

```typescript
ClientData {
  // ... existing fields
  documents?: {
    image1?: {
      url: string;        // Firebase Storage CDN URL
      fileName: string;   // Original filename
      uploadedAt: Date;   // Upload timestamp
      uploadedBy: string; // User UID who uploaded
      size: number;       // File size in bytes
    };
    image2?: {
      // Same structure
    };
  }
}
```

**Components Created:**

- **[FileUpload.svelte](file:///Users/mac/Documents/WebDev/contract-generator/src/lib/components/FileUpload.svelte)**: Reusable file upload component
  - File validation (size, type)
  - Upload progress indicator
  - Preview with file metadata (name, size, icon)
  - View and delete functionality
  - Disabled states during upload

**Integration:**

- **[ClientForm.svelte](file:///Users/mac/Documents/WebDev/contract-generator/src/lib/components/ClientForm.svelte)**: Integrated two FileUpload instances
  - Pre-generated clientId for immediate upload capability
  - Upload fields always visible (no need to save first)
  - Documents persist to Firestore on client save
  - ClientDocumentManager handles all storage operations

**Firebase Configuration:**

- **[firebase.ts](file:///Users/mac/Documents/WebDev/contract-generator/src/lib/config/firebase.ts)**: Added Firebase Storage initialization
- **[storage.rules](file:///Users/mac/Documents/WebDev/contract-generator/storage.rules)**: Security rules for document storage
  ```javascript
  match /client-documents/{clientId}/{fileName} {
    allow read: if isSignedIn();
    allow write: if isSignedIn()
      && request.resource.size < 500 * 1024  // 500KB limit
      && request.resource.contentType.matches('image/.*|application/pdf');
    allow delete: if isSignedIn();
  }
  ```

**Key Features:**

- Validation on both client and server side
- Automatic cleanup when client is deleted
- Error handling with user-friendly messages
- Loading states during upload operations
- Document metadata tracking (who uploaded, when, size)

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

### Svelte 5 + SvelteKit Data Loading Patterns

**For Route-Based Data (URL Parameters):**

Use SvelteKit's `load` functions - the proper way to handle route params:

```typescript
// +page.ts (client-side, has access to Firebase SDK)
import type { PageLoad } from './$types';
import { getAllContracts } from '$lib/utils/contracts';

export const load: PageLoad = async ({ params }) => {
  // Automatically re-runs when params change
  // Has access to Firebase client SDK
  const contracts = await getAllContracts();
  return { contracts };
};
```

```typescript
// +page.svelte (dead simple)
<script lang="ts">
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();
  // No $effect, no onMount - SvelteKit handles everything
</script>

{#each data.contracts as contract}
  <!-- render -->
{/each}
```

**Benefits:**
- Zero reactive code in component
- Automatic reloading when params change
- Built-in loading states
- SSR-friendly
- No autofixer warnings

**For One-Time Initialization:**

```typescript
// ✅ GOOD - onMount for one-time setup
onMount(async () => {
  const data = await loadInitialData();
  myState = data;
});
```

**For Navigation-Based Reloading:**

```typescript
// ✅ GOOD - afterNavigate for navigation triggers
import { afterNavigate } from '$app/navigation';

afterNavigate(() => {
  refreshData();
});
```

**When to use `$effect()`:**

Use ONLY for true side effects (no state mutations):

```typescript
// ✅ GOOD - DOM manipulation
$effect(() => {
  document.title = `${pageTitle} - App`;
});

// ✅ GOOD - Analytics tracking
$effect(() => {
  trackPageView(currentRoute);
});

// ❌ BAD - Data fetching with state mutation
$effect(() => {
  fetchData().then(data => {
    myData = data; // State mutation in $effect
  });
});

// ❌ BAD - Calling functions that mutate state
$effect(() => {
  loadUserData(userId); // Function mutates state
});
```

**Key Rule**: If your $effect mutates state or calls functions that mutate state, you're doing it wrong. Use load functions, onMount, or event-based patterns instead.

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
