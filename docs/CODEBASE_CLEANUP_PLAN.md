# Codebase Cleanup Plan

**Created:** 2026-01-09
**Status:** Ready for Implementation
**Estimated Effort:** 28-38 hours (~1 sprint)
**Last Updated:** 2026-01-09

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Priority 1: Critical Issues](#priority-1-critical-issues)
3. [Priority 2: Code Quality](#priority-2-code-quality)
4. [Priority 3: Technical Debt](#priority-3-technical-debt)
5. [Priority 4: Future Improvements](#priority-4-future-improvements)
6. [Testing Strategy](#testing-strategy)
7. [Success Metrics](#success-metrics)

---

## Executive Summary

### Current State

This Svelte 5 + TypeScript codebase is well-architected with modern patterns, but has accumulated technical debt in the form of:
- Code duplication (especially formatting utilities)
- Svelte 5 anti-patterns ($effect usage for prop-to-state syncing)
- Large component sizes (400-500+ lines)
- Debug code in production
- Scattered architecture (v1/v2 dual structure)

### Goals

1. **Eliminate code duplication** - Single source of truth for utilities
2. **Fix Svelte 5 anti-patterns** - Proper use of runes and reactive primitives
3. **Improve maintainability** - Smaller, focused components
4. **Clean production code** - Remove debug logs and unused code
5. **Complete v2 migration** - Unified architecture

### Impact

**Before Cleanup:**
- 5 duplicate `formatCurrency` implementations
- 14 files using $effect anti-pattern
- 2 components over 400 lines
- 66 console.log statements
- 16 migration scripts in /src

**After Cleanup:**
- 1 canonical formatting utility
- 0 $effect anti-patterns (only legitimate uses)
- 0 components over 150 lines
- <10 production logs (errors only)
- Migration scripts archived

---

## Priority 1: Critical Issues

**Estimated Effort:** 8-12 hours
**Impact:** High - Affects code quality, maintainability, and performance

### Task 1.1: Consolidate Formatting Utilities

**Effort:** 3-4 hours
**Files Affected:** 22 files (5 definitions + 17 imports)

#### Problem

Multiple implementations of the same formatting functions:

**`formatCurrency`** (5 locations):
1. `/src/lib/utils/formatting.ts` ✅ CANONICAL
2. `/src/lib/utils/eventPlanningFormHelpers.ts` (lines 158-160)
3. `/src/lib/utils/v2/contractDataTransformers.ts` (lines 10-12)
4. `/src/lib/utils/eventPlanningContractGenerator.ts` (lines 34-36)
5. `/src/lib/utils/serviceContractGenerator.ts` (lines 44-46)

**Date formatting** (3+ locations):
- `/src/lib/utils/formatting.ts` - `formatDateString`
- `/src/lib/utils/v2/contractDataTransformers.ts` - `formatDateVietnamese`, `formatDateEnglish`
- `/src/lib/utils/eventPlanningContractGenerator.ts` - duplicates

#### Action Steps

1. **Expand canonical formatting.ts:**

```typescript
// /src/lib/utils/formatting.ts
/**
 * Format a number as Vietnamese currency (VND)
 * @example formatCurrency(1000000) // "1.000.000 ₫"
 */
export function formatCurrency(amount: number): string {
	return new Intl.NumberFormat('vi-VN', {
		style: 'currency',
		currency: 'VND'
	}).format(amount);
}

/**
 * Format a date string in English format
 * @example formatDateString('2024-01-15') // "January 15, 2024"
 */
export function formatDateString(dateString: string): string {
	const date = new Date(dateString);
	return date.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
}

/**
 * Format a date string in Vietnamese format
 * @example formatDateVietnamese('2024-01-15') // "15 tháng 1, 2024"
 */
export function formatDateVietnamese(dateString: string): string {
	const date = new Date(dateString);
	return date.toLocaleDateString('vi-VN', {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
}

/**
 * Format a date string in English format (alias for formatDateString)
 */
export function formatDateEnglish(dateString: string): string {
	return formatDateString(dateString);
}
```

2. **Remove duplicate implementations:**

Files to edit:
- `/src/lib/utils/eventPlanningFormHelpers.ts` - Remove `formatCurrency` (lines 158-160)
- `/src/lib/utils/v2/contractDataTransformers.ts` - Remove `formatCurrency`, `formatDateVietnamese`, `formatDateEnglish`
- `/src/lib/utils/eventPlanningContractGenerator.ts` - Remove all formatting functions
- `/src/lib/utils/serviceContractGenerator.ts` - Remove inline `formatCurrency`

3. **Update imports in affected files:**

Files that import formatting functions (need to verify and update):
```typescript
// Update all to:
import { formatCurrency, formatDateString, formatDateVietnamese } from '$lib/utils/formatting';
```

**Files to check:**
- All files in `/src/lib/components/v2/contracts/`
- All files in `/src/lib/components/v2/counterparties/`
- All contract generator files
- All form helper files

4. **Verification:**

```bash
# Search for any remaining duplicate implementations
rg "function formatCurrency" src/
rg "function formatDate" src/

# Should only find 1 result in formatting.ts
```

#### Testing Checklist

- [ ] `pnpm check` passes (0 errors, 0 warnings)
- [ ] All contracts display currency correctly
- [ ] All dates format correctly in both languages
- [ ] No runtime errors in browser console
- [ ] Visual regression test on contract lists

---

### Task 1.2: Consolidate Contract Number Generation

**Effort:** 2 hours
**Files Affected:** 5 files

#### Problem

Contract number generation duplicated in 4 locations:
1. `/src/lib/utils/v2/contractDataTransformers.ts` - `generateContractNumber()` ✅ BEST
2. `/src/lib/utils/eventPlanningContractGenerator.ts` - inline (lines 62-70)
3. `/src/lib/utils/eventPlanningFormHelpers.ts` - `formatContractNumber()` (lines 91-101)
4. `/src/lib/utils/serviceContractGenerator.ts` - inline (lines 34-41)

#### Action Steps

1. **Create canonical contract helpers:**

```typescript
// /src/lib/utils/contractHelpers.ts (NEW FILE)
/**
 * Generate a unique contract number based on client name and timestamp
 * @param clientName - Client name to extract initials from
 * @param maxInitials - Maximum number of initials to include (default: no limit)
 * @returns Contract number in format: YYYYMMDD-INITIALS-XXX
 * @example generateContractNumber('Nguyen Van A') // "20260109-NVA-123"
 */
export function generateContractNumber(
	clientName: string,
	maxInitials?: number
): string {
	const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
	const initials = clientName
		.split(' ')
		.map((n) => n[0])
		.join('')
		.toUpperCase();
	const limitedInitials = maxInitials ? initials.slice(0, maxInitials) : initials;
	const timestamp = Date.now().toString().slice(-3);
	return `${dateStr}-${limitedInitials}-${timestamp}`;
}
```

2. **Remove duplicates:**

- `/src/lib/utils/v2/contractDataTransformers.ts` - Move function to contractHelpers.ts, import it
- `/src/lib/utils/eventPlanningContractGenerator.ts` - Remove inline implementation (lines 62-70), import from contractHelpers
- `/src/lib/utils/eventPlanningFormHelpers.ts` - Remove `formatContractNumber()`, import from contractHelpers
- `/src/lib/utils/serviceContractGenerator.ts` - Remove inline implementation, import from contractHelpers

3. **Update all imports:**

```typescript
import { generateContractNumber } from '$lib/utils/contractHelpers';
```

#### Testing Checklist

- [ ] Contract numbers generate correctly
- [ ] Format is consistent: YYYYMMDD-INITIALS-XXX
- [ ] No duplicate contract numbers generated
- [ ] `pnpm check` passes

---

### Task 1.3: Fix $effect Anti-Pattern in Forms

**Effort:** 4-6 hours
**Files Affected:** 14 files

#### Problem

Forms using `$effect` to sync props to state, which is an anti-pattern:
- ServiceProvisionForm.svelte (lines 75-100)
- EventPlanningForm.svelte (lines 79-104)
- ClientForm.svelte
- ServiceProviderForm.svelte
- EventForm.svelte
- 9 other files

#### Current Anti-Pattern

```svelte
<!-- ❌ BAD: ServiceProvisionForm.svelte -->
<script lang="ts">
	let { contract = null } = $props();

	let contractNumber = $state('');
	let eventId = $state('');
	let counterpartyId = $state('');
	// ... 30+ more fields

	$effect(() => {
		if (contract) {
			contractNumber = contract.contractNumber;
			eventId = contract.eventId || '';
			counterpartyId = contract.counterpartyId;
			// ... 30+ more assignments
		}
	});
</script>
```

#### Solution: Use Form State Class + onMount

```svelte
<!-- ✅ GOOD: ServiceProvisionForm.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { ServiceProvisionContractFormState } from '$lib/state/v2/serviceProvisionContractFormState.svelte';

	let { contract = null } = $props();

	const formState = new ServiceProvisionContractFormState();

	// One-time initialization on mount
	onMount(() => {
		formState.init(contract);
	});
</script>

<form>
	<input bind:value={formState.contractNumber} />
	<input bind:value={formState.eventId} />
	<!-- Use formState.field instead of local state -->
</form>
```

#### Action Steps

**For each form component:**

1. **Check if Form State Class exists:**
   - ServiceProvisionForm → ServiceProvisionContractFormState ✅ EXISTS
   - EventPlanningForm → EventPlanningContractFormState ✅ EXISTS
   - ClientForm → ClientFormState ✅ EXISTS
   - ServiceProviderForm → ServiceProviderFormState ✅ EXISTS
   - EventForm → EventFormState ❓ CHECK

2. **If Form State Class doesn't exist, create it:**

```typescript
// /src/lib/state/v2/exampleFormState.svelte.ts
export class ExampleFormState {
	// All form fields as $state
	field1 = $state('');
	field2 = $state(0);
	// ...

	/**
	 * Initialize form state from existing data
	 */
	init(data: ExampleType | null) {
		if (!data) {
			this.reset();
			return;
		}
		this.field1 = data.field1;
		this.field2 = data.field2;
		// ...
	}

	/**
	 * Reset form to empty state
	 */
	reset() {
		this.field1 = '';
		this.field2 = 0;
		// ...
	}

	// Helper methods as needed
}
```

3. **Refactor component to use Form State Class:**

Replace:
```typescript
// Before
let field1 = $state('');
let field2 = $state(0);

$effect(() => {
	if (data) {
		field1 = data.field1;
		field2 = data.field2;
	}
});
```

With:
```typescript
// After
import { onMount } from 'svelte';
const formState = new ExampleFormState();

onMount(() => {
	formState.init(data);
});
```

4. **Update template bindings:**

Replace:
```svelte
<input bind:value={field1} />
```

With:
```svelte
<input bind:value={formState.field1} />
```

#### Files to Fix (in order)

1. **ServiceProvisionForm.svelte** (highest priority - 538 lines)
   - State class: ServiceProvisionContractFormState ✅
   - Replace $effect with onMount + formState.init()

2. **EventPlanningForm.svelte** (476 lines)
   - State class: EventPlanningContractFormState ✅
   - Replace $effect with onMount + formState.init()

3. **ClientForm.svelte**
   - State class: ClientFormState ✅
   - Replace $effect with onMount + formState.init()

4. **ServiceProviderForm.svelte**
   - State class: ServiceProviderFormState ✅
   - Replace $effect with onMount + formState.init()

5. **EventForm.svelte**
   - Check if EventFormState exists, create if needed
   - Replace $effect with onMount + formState.init()

6. **Remaining files** (9 files in routes/admin/, AppShell.svelte, etc.)
   - Audit each usage
   - Keep $effect only for legitimate side effects (subscriptions, DOM manipulation)
   - Replace prop-to-state syncing with onMount or $derived

#### Legitimate $effect Uses (Keep These)

```typescript
// ✅ GOOD: Managing subscriptions
$effect(() => {
	eventState.init();
	counterpartyState.init();
	return () => {
		eventState.destroy();
		counterpartyState.destroy();
	};
});

// ✅ GOOD: DOM manipulation
$effect(() => {
	if (isOpen && modalRef) {
		modalRef.focus();
	}
});

// ✅ GOOD: External API calls
$effect(() => {
	if (userId) {
		fetchUserData(userId);
	}
});
```

#### Testing Checklist

- [ ] Forms initialize correctly with existing data
- [ ] Forms reset correctly when data is null
- [ ] Two-way binding works (input changes update state)
- [ ] Form submission uses correct state values
- [ ] No infinite loops or re-render issues
- [ ] `pnpm check` passes (0 errors, 0 warnings)
- [ ] Run autofixer on all modified components

---

### Task 1.4: Remove `any` Types

**Effort:** 1 hour
**Files Affected:** 2 files

#### Problem

TypeScript `any` types defeat the purpose of type safety:

1. `/src/lib/utils.ts` (lines 8-11):
```typescript
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T;
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T;
```

2. `/src/lib/utils/ClientRepository.ts` (lines 100-101):
```typescript
private convertTimestamps(documents?: {
	image1?: any;
	image2?: any;
}): { image1?: DocumentMetadata; image2?: DocumentMetadata } | undefined {
```

#### Action Steps

1. **Fix utils.ts:**

```typescript
// Before
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T;

// After
export type WithoutChild<T> = T extends { child?: unknown } ? Omit<T, 'child'> : T;
export type WithoutChildren<T> = T extends { children?: unknown } ? Omit<T, 'children'> : T;
```

2. **Fix ClientRepository.ts:**

```typescript
// Before
private convertTimestamps(documents?: {
	image1?: any;
	image2?: any;
}): { image1?: DocumentMetadata; image2?: DocumentMetadata } | undefined {

// After
private convertTimestamps(documents?: {
	image1?: DocumentMetadata | { uploadedAt?: unknown };
	image2?: DocumentMetadata | { uploadedAt?: unknown };
}): { image1?: DocumentMetadata; image2?: DocumentMetadata } | undefined {
```

Or better yet, define a proper type:

```typescript
type DocumentInput = {
	image1?: DocumentMetadata | { uploadedAt?: Timestamp | FieldValue };
	image2?: DocumentMetadata | { uploadedAt?: Timestamp | FieldValue };
};

private convertTimestamps(documents?: DocumentInput): {
	image1?: DocumentMetadata;
	image2?: DocumentMetadata;
} | undefined {
```

#### Testing Checklist

- [ ] `pnpm check` passes with no type errors
- [ ] No `any` types found: `rg ":\s*any[^a-zA-Z]" src/lib/`
- [ ] All type inference still works correctly

---

## Priority 2: Code Quality

**Estimated Effort:** 8-10 hours
**Impact:** Medium - Improves code cleanliness and maintainability

### Task 2.1: Remove Debug Console Logs

**Effort:** 2-3 hours
**Files Affected:** 16 files (66 console.log statements)

#### Problem

Production code contains extensive debug logging:

```typescript
// +page.svelte - extensive debug logging
$effect(() => {
	console.log('Contract States:', {
		eventPlanning: {
			count: eventPlanningContractState.contracts.length,
			contracts: eventPlanningContractState.contracts
		},
		// ... 20 more lines of debug output
	});
});
```

**Files with console.logs:**
- `/src/routes/+page.svelte` (15+ logs)
- Various form components (error logging)
- State management files
- Repository files

#### Action Steps

1. **Audit all console.logs:**

```bash
# Find all console.log statements
rg "console\.log" src/ -n

# Count by file
rg "console\.log" src/ -c
```

2. **Categorize logs:**

**Remove these:**
- Debug logs: `console.log('Debug:', ...)`
- State inspection: `console.log('Current state:', ...)`
- Execution flow: `console.log('Entering function...')`

**Keep these (convert to proper error handling):**
- Error logs: `console.error('Failed to save:', error)`
- Critical warnings: `console.warn('Data validation failed:', ...)`

3. **Create development-only logging utility:**

```typescript
// /src/lib/utils/logger.ts (NEW FILE)
import { dev } from '$app/environment';

export const logger = {
	debug: (...args: unknown[]) => {
		if (dev) {
			console.log('[DEBUG]', ...args);
		}
	},

	info: (...args: unknown[]) => {
		if (dev) {
			console.info('[INFO]', ...args);
		}
	},

	warn: (...args: unknown[]) => {
		console.warn('[WARN]', ...args);
	},

	error: (...args: unknown[]) => {
		console.error('[ERROR]', ...args);
	}
};
```

4. **Replace debug logs:**

```typescript
// Before
console.log('Contract States:', contractStates);

// After (if needed for development)
import { logger } from '$lib/utils/logger';
logger.debug('Contract States:', contractStates);

// Or better: remove entirely if not needed
```

5. **Keep essential error logs:**

```typescript
// Keep (but use logger)
try {
	await saveContract(data);
} catch (error) {
	logger.error('Failed to save contract:', error);
	throw error;
}
```

#### Files to Clean

1. **High Priority (remove extensive debug logs):**
   - `/src/routes/+page.svelte`
   - `/src/lib/state/v2/serviceProvisionContractState.svelte.ts`
   - `/src/lib/state/v2/eventPlanningContractState.svelte.ts`

2. **Medium Priority (convert to logger):**
   - All form components with error logging
   - Repository files with validation logs

3. **Low Priority (audit and decide):**
   - Utility functions with debug output

#### Testing Checklist

- [ ] No console.log in production build
- [ ] Essential errors still logged
- [ ] `pnpm build` succeeds
- [ ] Check browser console in production mode (should be clean)
- [ ] Development mode still has useful logging via logger

---

### Task 2.2: Archive Migration Scripts

**Effort:** 1 hour
**Files Affected:** 16 files

#### Problem

One-time migration scripts are in `/src/lib/migration/`, increasing bundle size:

```
/src/lib/migration/
├── addTimestampsToCounterparties.ts
├── cleanCounterpartyData.ts
├── fixCounterpartyId.ts
├── fixCounterpartyNames.ts
├── fixCounterpartyNullValues.ts
├── migrateClients.ts
├── migrateEventPlanningContracts.ts
├── migrateServiceContracts.ts
└── ... (16 files total)
```

#### Action Steps

1. **Create migrations archive directory:**

```bash
mkdir -p migrations-archive
```

2. **Create migration log:**

```markdown
# migrations-archive/MIGRATION_LOG.md

# Database Migration History

## Completed Migrations

### 2024-XX-XX: Add Timestamps to Counterparties
**Script:** `addTimestampsToCounterparties.ts`
**Status:** ✅ Completed
**Description:** Added createdAt and updatedAt timestamps to all counterparty documents.

### 2024-XX-XX: Clean Counterparty Data
**Script:** `cleanCounterpartyData.ts`
**Status:** ✅ Completed
**Description:** Removed invalid fields and normalized data structure.

... (document all migrations)

## How to Run Migrations

Migration scripts are archived and should only be used for reference or emergency rollback.

If you need to run a migration:
1. Copy script from `migrations-archive/` to `/src/lib/migration/`
2. Review and test on development database
3. Run migration
4. Move script back to archive
5. Update this log
```

3. **Move migration scripts:**

```bash
# Move all migration scripts
mv src/lib/migration/*.ts migrations-archive/

# Remove empty directory
rmdir src/lib/migration/
```

4. **Update .gitignore if needed:**

```gitignore
# Keep migration archive in git for reference
!migrations-archive/
```

5. **Document in README:**

Add to main README.md:
```markdown
## Database Migrations

Historical database migration scripts are archived in `/migrations-archive/`.
These are one-time scripts that have already been run and are kept for reference only.

See `/migrations-archive/MIGRATION_LOG.md` for migration history.
```

#### Testing Checklist

- [ ] Application builds without errors
- [ ] No imports reference `/lib/migration/`
- [ ] Migration scripts safely archived in project root
- [ ] Migration log documents all scripts
- [ ] README updated with migration documentation

---

### Task 2.3: Break Down Large Components

**Effort:** 5-6 hours
**Files Affected:** 2 components

#### Problem

Two form components exceed 400 lines (guideline: <150 lines):
- ServiceProvisionForm.svelte: **538 lines**
- EventPlanningForm.svelte: **476 lines**

Both already use section components, but parent forms handle too much logic.

#### Current Structure

```svelte
<!-- ServiceProvisionForm.svelte (538 lines) -->
<script>
	// 50+ lines of imports
	// 30+ $state variables
	// Form validation logic
	// Submission handling
	// Error handling
	// Event/counterparty selection logic
</script>

<!-- 400+ lines of template -->
<form>
	<ServiceDetailsSection />
	<FinancialSection />
	<BankingSection />
	<ClientInfoSection />
	<!-- ... -->
</form>
```

#### Target Structure

```
ServiceProvisionForm.svelte (50-75 lines)
└── Uses ServiceProvisionFormState class
    └── Delegates to ServiceProvisionFormContainer
        ├── ServiceDetailsSection
        ├── FinancialSection
        ├── BankingSection
        └── ClientInfoSection

Utils extracted to:
├── /utils/v2/serviceProvisionFormHelpers.ts
│   ├── validateServiceProvisionForm()
│   └── submitServiceProvisionForm()
└── /utils/v2/formValidation.ts
    └── Generic validation helpers
```

#### Action Steps

**For ServiceProvisionForm.svelte:**

1. **Create form helpers utility:**

```typescript
// /src/lib/utils/v2/serviceProvisionFormHelpers.ts
import type { ServiceProvisionContractFormState } from '$lib/state/v2/serviceProvisionContractFormState.svelte';
import { serviceProvisionContractSchema } from '$lib/schemas/v2/contracts/serviceProvisionContract';

export function validateServiceProvisionForm(
	formState: ServiceProvisionContractFormState
): { valid: boolean; errors: string[] } {
	const result = serviceProvisionContractSchema.safeParse({
		// Map formState to schema
		contractNumber: formState.contractNumber,
		eventId: formState.eventId,
		// ... all fields
	});

	if (!result.success) {
		return {
			valid: false,
			errors: result.error.errors.map(e => e.message)
		};
	}

	return { valid: true, errors: [] };
}

export async function submitServiceProvisionForm(
	formState: ServiceProvisionContractFormState
): Promise<{ success: boolean; contractId?: string; error?: string }> {
	// Validation
	const validation = validateServiceProvisionForm(formState);
	if (!validation.valid) {
		return { success: false, error: validation.errors.join(', ') };
	}

	// Transform to contract data
	const contractData = {
		// Map formState to contract schema
	};

	// Save to database
	try {
		const contractId = await saveServiceProvisionContract(contractData);
		return { success: true, contractId };
	} catch (error) {
		return { success: false, error: String(error) };
	}
}
```

2. **Simplify parent component:**

```svelte
<!-- ServiceProvisionForm.svelte (target: <100 lines) -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { ServiceProvisionContractFormState } from '$lib/state/v2/serviceProvisionContractFormState.svelte';
	import { submitServiceProvisionForm } from '$lib/utils/v2/serviceProvisionFormHelpers';
	import ServiceProvisionFormContainer from './ServiceProvisionFormContainer.svelte';

	let { contract = null, onSuccess } = $props();

	const formState = new ServiceProvisionContractFormState();
	let submitting = $state(false);
	let error = $state<string | null>(null);

	onMount(() => {
		formState.init(contract);
	});

	async function handleSubmit() {
		submitting = true;
		error = null;

		const result = await submitServiceProvisionForm(formState);

		if (result.success) {
			onSuccess?.(result.contractId!);
		} else {
			error = result.error!;
		}

		submitting = false;
	}
</script>

<ServiceProvisionFormContainer
	{formState}
	{submitting}
	{error}
	{handleSubmit}
/>
```

3. **Create container component:**

```svelte
<!-- ServiceProvisionFormContainer.svelte (200-250 lines) -->
<script lang="ts">
	import type { ServiceProvisionContractFormState } from '$lib/state/v2/serviceProvisionContractFormState.svelte';
	import ServiceDetailsSection from './sections/ServiceDetailsSection.svelte';
	import FinancialSection from './sections/FinancialSection.svelte';
	import BankingSection from './sections/BankingSection.svelte';
	import ClientInfoSection from './sections/ClientInfoSection.svelte';

	let {
		formState,
		submitting,
		error,
		handleSubmit
	}: {
		formState: ServiceProvisionContractFormState;
		submitting: boolean;
		error: string | null;
		handleSubmit: () => void;
	} = $props();
</script>

<form onsubmit={handleSubmit} class="space-y-6">
	{#if error}
		<div class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
			{error}
		</div>
	{/if}

	<ServiceDetailsSection bind:formState />
	<FinancialSection bind:formState />
	<BankingSection bind:formState />
	<ClientInfoSection bind:formState />

	<div class="flex gap-4">
		<button
			type="submit"
			disabled={submitting}
			class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
		>
			{submitting ? 'Saving...' : 'Save Contract'}
		</button>
	</div>
</form>
```

4. **Repeat for EventPlanningForm.svelte**

**For EventPlanningForm.svelte:**

Follow same pattern:
1. Create `/utils/v2/eventPlanningFormHelpers.ts`
2. Extract validation and submission logic
3. Simplify parent component
4. Create EventPlanningFormContainer.svelte

#### Testing Checklist

- [ ] Forms render correctly
- [ ] Forms submit successfully
- [ ] Validation works as expected
- [ ] Error handling displays correctly
- [ ] No component exceeds 150 lines
- [ ] `pnpm check` passes (0 errors, 0 warnings)
- [ ] Autofixer validates all components
- [ ] Visual regression test

---

## Priority 3: Technical Debt

**Estimated Effort:** 12-16 hours
**Impact:** Medium - Long-term maintainability and code organization

### Task 3.1: Complete v2 Architecture Migration

**Effort:** 6-8 hours
**Files Affected:** Multiple files in /src/lib

#### Problem

Dual architecture with both legacy (root level) and v2 folders causes confusion:

```
src/lib/
├── components/
│   ├── ContractCard.svelte (legacy)
│   └── v2/
│       └── contracts/
│           └── ContractCard.svelte (new)
├── utils/
│   ├── formatting.ts (which one to use?)
│   └── v2/
│       └── contractDataTransformers.ts
```

#### Action Steps

1. **Audit legacy files:**

```bash
# Find files not in v2 structure
find src/lib/components -maxdepth 1 -name "*.svelte" | grep -v "ui/"
find src/lib/utils -maxdepth 1 -name "*.ts"
find src/lib/types -maxdepth 1 -name "*.ts"
```

2. **Categorize each file:**
   - **In use, has v2 equivalent** → Delete legacy, update imports
   - **In use, no v2 equivalent** → Move to v2 structure
   - **Not in use** → Delete or archive

3. **Create migration checklist:**

Track in `/docs/V2_MIGRATION_CHECKLIST.md`:

```markdown
# v2 Architecture Migration Checklist

## Components

- [ ] ContractCard.svelte → Use v2 version only
- [ ] ContractsList.svelte → Use v2 version only
- [ ] LoginForm.svelte → Audit usage, move or delete
- [ ] AppShell.svelte → Move to v2 or keep at root (layout component)

## Utils

- [x] formatting.ts → Keep at root (canonical)
- [ ] contractHelpers.ts → Move to v2 after creation
- [ ] eventPlanningFormHelpers.ts → Delete after consolidation
- [ ] mergeContracts.ts → Keep (temporary until base contract refactor)

## Types

- [ ] Review all type files
- [ ] Consolidate in v2 structure

## Schemas

- [x] All in v2 ✅

## State

- [x] All in v2 ✅
```

4. **Update imports:**

After moving files, update all imports:
```bash
# Find imports of moved files
rg "from '\$lib/components/OldComponent'" src/
```

5. **Remove empty v2 folders:**

After migration, remove /v2 folder structure and move all to canonical locations:
```
src/lib/
├── components/
│   ├── contracts/
│   ├── counterparties/
│   └── events/
├── utils/
├── types/
├── schemas/
└── state/
```

#### Testing Checklist

- [ ] No /v2 folders remain (or v2 is canonical)
- [ ] All imports updated
- [ ] `pnpm check` passes
- [ ] Application builds successfully
- [ ] No runtime errors

---

### Task 3.2: Audit and Remove Unused Components

**Effort:** 3-4 hours
**Files Affected:** Multiple components

#### Problem

Several components marked as "not checked" in AUTOFIXER_STATUS.md may be unused:
- Legacy event-planning section components
- Potential duplicate components
- Old UI components

#### Action Steps

1. **Generate component usage report:**

```bash
# Create script to find unused components
# /scripts/find-unused-components.sh

#!/bin/bash
echo "# Component Usage Report" > docs/COMPONENT_USAGE_REPORT.md
echo "" >> docs/COMPONENT_USAGE_REPORT.md

for file in $(find src/lib/components -name "*.svelte"); do
	component=$(basename "$file" .svelte)
	usage=$(rg -l "import.*$component" src/)
	count=$(echo "$usage" | grep -c "^" || echo "0")

	echo "## $component" >> docs/COMPONENT_USAGE_REPORT.md
	echo "Usage count: $count" >> docs/COMPONENT_USAGE_REPORT.md

	if [ "$count" -eq "0" ]; then
		echo "❌ UNUSED - Consider removing" >> docs/COMPONENT_USAGE_REPORT.md
	else
		echo "✅ In use" >> docs/COMPONENT_USAGE_REPORT.md
		echo "$usage" >> docs/COMPONENT_USAGE_REPORT.md
	fi

	echo "" >> docs/COMPONENT_USAGE_REPORT.md
done
```

2. **Review AUTOFIXER_STATUS.md unchecked components:**

Components not checked (from review):
- ContractValue.svelte
- LoginForm.svelte
- Legacy section components

For each:
- Check if imported anywhere
- Check git history (last modified date)
- Decide: Keep, Archive, or Delete

3. **Create archive for removed components:**

```bash
mkdir -p archive/components
# Move unused components to archive with git history
git mv src/lib/components/UnusedComponent.svelte archive/components/
```

4. **Document decisions:**

```markdown
# archive/ARCHIVED_COMPONENTS.md

## Archived Components

### UnusedComponent.svelte
**Date Archived:** 2026-01-09
**Reason:** No longer used after v2 migration
**Last Used:** 2025-12-15
**Replacement:** NewComponentV2.svelte
```

#### Testing Checklist

- [ ] All unused components identified
- [ ] Components archived with documentation
- [ ] `pnpm check` passes
- [ ] Application still functions correctly
- [ ] Usage report generated

---

### Task 3.3: Complete Autofixer Validation

**Effort:** 3-4 hours
**Files Affected:** 60+ unchecked components

#### Problem

AUTOFIXER_STATUS.md shows only ~30/90 components checked with autofixer.

#### Action Steps

1. **Generate component checklist:**

```bash
# List all custom components (excluding shadcn ui/)
find src/lib/components -name "*.svelte" | grep -v "/ui/" > docs/AUTOFIXER_CHECKLIST.txt
```

2. **Create autofixer batch script:**

```typescript
// scripts/batch-autofixer.ts
import { mcp__svelte__svelte_autofixer } from '@svelte/autofixer';
import fs from 'fs';
import path from 'path';

const componentsDir = 'src/lib/components';
const excludeDirs = ['ui']; // Skip shadcn components

async function checkComponent(filePath: string) {
	const code = fs.readFileSync(filePath, 'utf-8');
	const result = await mcp__svelte__svelte_autofixer({
		code,
		desired_svelte_version: 5,
		filename: path.basename(filePath)
	});

	return {
		file: filePath,
		suggestions: result.suggestions || []
	};
}

// Main execution
async function main() {
	const components = getAllComponents(componentsDir, excludeDirs);

	console.log(`Checking ${components.length} components...`);

	for (const component of components) {
		const result = await checkComponent(component);

		if (result.suggestions.length > 0) {
			console.log(`\n❌ ${result.file}`);
			console.log(result.suggestions);
		} else {
			console.log(`✅ ${result.file}`);
		}
	}
}

main();
```

3. **Check all components systematically:**

For each component:
- Run autofixer
- Document suggestions in AUTOFIXER_STATUS.md
- Fix issues immediately or add to backlog
- Update status

4. **Update AUTOFIXER_STATUS.md:**

```markdown
## Components Status

### Fully Validated (0 suggestions)
- [x] ContractCard.svelte
- [x] ContractListItem.svelte
- [x] ServiceProvisionForm.svelte
... (list all passing)

### Has Suggestions (needs fixing)
- [ ] ComponentX.svelte (3 suggestions)
  - Use $derived instead of $effect
  - Fix prop destructuring
  - Update reactive statement

### Not Yet Checked
- [ ] ComponentY.svelte
```

5. **Address all autofixer suggestions:**

**Zero tolerance:** ALL suggestions must be addressed.

Create issues for each component with suggestions:
- Priority 1: Anti-patterns ($effect misuse)
- Priority 2: Best practices (prop destructuring, reactivity)
- Priority 3: Style/conventions

#### Testing Checklist

- [ ] All components checked with autofixer
- [ ] AUTOFIXER_STATUS.md 100% complete
- [ ] All Priority 1 issues fixed
- [ ] All Priority 2 issues fixed or documented
- [ ] `pnpm check` passes (0 errors, 0 warnings)

---

## Priority 4: Future Improvements

**Estimated Effort:** Variable (can be done incrementally)
**Impact:** Low - Nice to have, improves developer experience

### Task 4.1: Add Comprehensive Testing

**Effort:** 16-20 hours (future sprint)

#### Current State

No automated tests found in codebase.

#### Proposed Testing Strategy

1. **Unit Tests (Vitest)**

Test utilities and business logic:
```typescript
// src/lib/utils/formatting.test.ts
import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDateString } from './formatting';

describe('formatCurrency', () => {
	it('formats numbers as Vietnamese currency', () => {
		expect(formatCurrency(1000000)).toBe('1.000.000 ₫');
	});

	it('handles zero', () => {
		expect(formatCurrency(0)).toBe('0 ₫');
	});

	it('handles negative numbers', () => {
		expect(formatCurrency(-500000)).toBe('-500.000 ₫');
	});
});
```

**Files to test:**
- All utilities in /lib/utils/
- Form state classes in /lib/state/v2/
- Schema validators in /lib/schemas/v2/

2. **Component Tests (Vitest + Testing Library)**

Test component behavior:
```typescript
// src/lib/components/v2/contracts/ContractCard.test.ts
import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import ContractCard from './ContractCard.svelte';

describe('ContractCard', () => {
	it('renders contract information', () => {
		const contract = {
			counterpartyName: 'Test Client',
			contractNumber: '20260109-TC-001',
			contractValue: 1000000,
			// ... other props
		};

		render(ContractCard, { props: { contract } });

		expect(screen.getByText('Test Client')).toBeInTheDocument();
		expect(screen.getByText('20260109-TC-001')).toBeInTheDocument();
	});
});
```

3. **E2E Tests (Playwright)**

Test critical user flows:
```typescript
// tests/e2e/contract-creation.spec.ts
import { test, expect } from '@playwright/test';

test('create service provision contract', async ({ page }) => {
	await page.goto('/contracts/new/service-provision');

	// Fill form
	await page.fill('[name="counterpartyName"]', 'Test Client');
	await page.fill('[name="serviceDescription"]', 'Testing services');
	await page.fill('[name="contractValue"]', '1000000');

	// Submit
	await page.click('button[type="submit"]');

	// Verify success
	await expect(page.locator('.success-message')).toBeVisible();
});
```

#### Action Steps (Future)

1. Install testing dependencies
2. Configure Vitest and Playwright
3. Write tests for utilities (high value, low effort)
4. Write component tests for critical components
5. Write E2E tests for main user flows
6. Add to CI/CD pipeline

---

### Task 4.2: Implement Logging System

**Effort:** 2-3 hours

Already planned in Task 2.1. Enhance with:
- Remote logging (Sentry, LogRocket)
- Performance monitoring
- Error tracking

---

### Task 4.3: Add Documentation

**Effort:** 4-6 hours

#### JSDoc for Utilities

```typescript
/**
 * Formats a number as Vietnamese currency (VND)
 *
 * @param amount - The amount to format
 * @returns Formatted currency string with VND symbol
 *
 * @example
 * formatCurrency(1000000) // "1.000.000 ₫"
 * formatCurrency(0) // "0 ₫"
 */
export function formatCurrency(amount: number): string {
	// ...
}
```

#### Component Props with TSDoc

```typescript
interface Props {
	/**
	 * The contract data to display
	 */
	contract: UnifiedContract;

	/**
	 * Whether the card should show in compact mode
	 * @default false
	 */
	compact?: boolean;

	/**
	 * Callback fired when the contract is clicked
	 */
	onClick?: (contractId: string) => void;
}
```

#### Architecture Decision Records (ADRs)

```markdown
# ADR 001: Use Form State Classes for Complex Forms

**Status:** Accepted
**Date:** 2025-12-XX
**Context:** Forms with 20+ fields became hard to manage with individual $state variables.
**Decision:** Implement Form State Class pattern with init/reset methods.
**Consequences:**
- ✅ Cleaner component code
- ✅ Reusable state logic
- ✅ Easier testing
- ❌ Slight learning curve for new developers
```

---

## Testing Strategy

### Manual Testing Checklist

After each priority level completion:

**Smoke Tests:**
- [ ] Application builds: `pnpm build`
- [ ] TypeScript validation: `pnpm check` (0 errors, 0 warnings)
- [ ] Application runs: `pnpm dev`
- [ ] No console errors in browser

**Functional Tests:**
- [ ] Create new contract (all types)
- [ ] Edit existing contract
- [ ] Delete contract
- [ ] List contracts (pagination, filtering)
- [ ] Create new counterparty
- [ ] Edit existing counterparty
- [ ] Create new event
- [ ] Currency formatting displays correctly
- [ ] Date formatting displays correctly
- [ ] Form validation works
- [ ] Form submission succeeds
- [ ] Error handling displays

**Visual Regression:**
- [ ] Contract list displays correctly (desktop, tablet, mobile)
- [ ] Contract cards render properly
- [ ] Forms layout correctly
- [ ] Buttons and inputs styled consistently
- [ ] Responsive design works at all breakpoints

### Automated Testing (Future)

Once tests are implemented (Task 4.1):

```bash
# Run all tests before each commit
pnpm test

# Run E2E tests before deployment
pnpm test:e2e

# Check test coverage
pnpm test:coverage
```

**Coverage Goals:**
- Utilities: 90%+
- Form State Classes: 80%+
- Components: 60%+
- E2E critical flows: 100%

---

## Success Metrics

### Quantitative Metrics

**Code Quality:**
- [ ] 0 files with `any` types (currently 2)
- [ ] 0 components using $effect anti-pattern (currently 14)
- [ ] 1 implementation of formatCurrency (currently 5)
- [ ] <10 console.log statements (currently 66)
- [ ] 0 components over 150 lines (currently 2 over 400)
- [ ] 100% autofixer validation (currently ~33%)

**Type Safety:**
- [ ] `pnpm check` shows 0 errors and 0 warnings
- [ ] No `as any` type casts
- [ ] No `@ts-ignore` comments

**Bundle Size:**
- [ ] Measure before/after cleanup
- [ ] Target: 10-15% reduction from removing unused code
- [ ] 16 migration scripts removed from bundle

### Qualitative Metrics

**Developer Experience:**
- [ ] Clear file structure (no v1/v2 confusion)
- [ ] Consistent patterns across codebase
- [ ] Easy to find utilities (single source of truth)
- [ ] Components are small and focused

**Maintainability:**
- [ ] New developers can understand component structure
- [ ] Business logic is testable (extracted from components)
- [ ] Forms follow consistent patterns
- [ ] Codebase adheres to Svelte 5 best practices

**Performance:**
- [ ] Smaller bundle size
- [ ] Fewer re-renders (proper reactivity)
- [ ] No infinite loops from $effect anti-patterns

---

## Implementation Timeline

### Week 1: Priority 1 (Critical)

**Days 1-2:** Consolidate utilities
- Task 1.1: Formatting functions
- Task 1.2: Contract number generation
- Testing and verification

**Days 3-5:** Fix anti-patterns and types
- Task 1.3: $effect anti-pattern (14 files)
- Task 1.4: Remove `any` types
- Comprehensive testing

### Week 2: Priority 2 (Quality)

**Days 1-2:** Clean production code
- Task 2.1: Remove console.logs
- Task 2.2: Archive migrations
- Testing and verification

**Days 3-5:** Component refactoring
- Task 2.3: Break down large components
- Comprehensive testing
- Visual regression testing

### Week 3: Priority 3 (Technical Debt)

**Days 1-3:** Architecture migration
- Task 3.1: Complete v2 migration
- Task 3.2: Audit unused components
- Testing and verification

**Days 4-5:** Autofixer completion
- Task 3.3: Check all remaining components
- Fix all suggestions
- Final validation

### Future Sprints: Priority 4

- Task 4.1: Add testing (dedicated sprint)
- Task 4.2: Logging system (with Task 2.1)
- Task 4.3: Documentation (continuous)

---

## Risk Mitigation

### Potential Risks

1. **Breaking Changes**
   - Risk: Refactoring breaks existing functionality
   - Mitigation: Test thoroughly after each task; use git branches

2. **Import Update Errors**
   - Risk: Miss some imports when consolidating utilities
   - Mitigation: Use global search; run `pnpm check` frequently

3. **Component Refactoring Issues**
   - Risk: Breaking forms when extracting logic
   - Mitigation: Refactor one component at a time; test immediately

4. **Merge Conflicts**
   - Risk: Multiple files changed simultaneously
   - Mitigation: Coordinate with team; use feature branches

### Rollback Plan

**For each major task:**

1. Create feature branch: `git checkout -b cleanup/task-1-1`
2. Commit frequently with descriptive messages
3. Tag before starting: `git tag pre-cleanup-task-1-1`
4. If issues arise: `git revert` or `git reset --hard <tag>`

**Branch Strategy:**

```
main
├── cleanup/utilities (Tasks 1.1, 1.2)
├── cleanup/anti-patterns (Tasks 1.3, 1.4)
├── cleanup/production-code (Tasks 2.1, 2.2)
├── cleanup/large-components (Task 2.3)
└── cleanup/architecture (Tasks 3.1, 3.2, 3.3)
```

Merge to main only after thorough testing.

---

## Appendix A: File Reference

### Files to Modify (Priority 1)

**Task 1.1: Formatting Utilities**
- `/src/lib/utils/formatting.ts` (expand)
- `/src/lib/utils/eventPlanningFormHelpers.ts` (remove duplicates)
- `/src/lib/utils/v2/contractDataTransformers.ts` (remove duplicates)
- `/src/lib/utils/eventPlanningContractGenerator.ts` (remove duplicates)
- `/src/lib/utils/serviceContractGenerator.ts` (remove duplicates)
- 17+ files with imports (update)

**Task 1.2: Contract Helpers**
- Create: `/src/lib/utils/contractHelpers.ts`
- `/src/lib/utils/v2/contractDataTransformers.ts` (move function)
- `/src/lib/utils/eventPlanningContractGenerator.ts` (remove duplicate)
- `/src/lib/utils/eventPlanningFormHelpers.ts` (remove duplicate)
- `/src/lib/utils/serviceContractGenerator.ts` (remove duplicate)

**Task 1.3: $effect Anti-Pattern**
- `/src/lib/components/v2/contracts/ServiceProvisionForm.svelte`
- `/src/lib/components/v2/contracts/EventPlanningForm.svelte`
- `/src/lib/components/v2/counterparties/ClientForm.svelte`
- `/src/lib/components/v2/counterparties/ServiceProviderForm.svelte`
- `/src/lib/components/v2/events/EventForm.svelte`
- `/src/routes/+page.svelte`
- `/src/routes/+layout.svelte`
- 7+ more files in /routes/admin/

**Task 1.4: Remove `any` Types**
- `/src/lib/utils.ts`
- `/src/lib/utils/ClientRepository.ts`

---

## Appendix B: Commands Reference

### Useful Commands

**Search for code patterns:**
```bash
# Find all formatCurrency implementations
rg "function formatCurrency" src/

# Find all $effect usages
rg "\$effect\(" src/

# Find all any types
rg ":\s*any[^a-zA-Z]" src/lib/

# Find all console.log statements
rg "console\.log" src/

# Count components
find src/lib/components -name "*.svelte" | wc -l
```

**Validation:**
```bash
# TypeScript check
pnpm check

# Build check
pnpm build

# Run dev server
pnpm dev

# Lint code
pnpm lint
```

**Git workflows:**
```bash
# Create feature branch
git checkout -b cleanup/task-1-1

# Create rollback point
git tag pre-cleanup-task-1-1

# Commit changes
git add .
git commit -m "feat: consolidate formatting utilities"

# Merge to main
git checkout main
git merge cleanup/task-1-1
```

---

## Appendix C: Update Log

### Changes to This Document

| Date | Change | Author |
|------|--------|--------|
| 2026-01-09 | Initial creation | AI Assistant |
| | | |

---

**End of Cleanup Plan**

For questions or clarifications, refer to:
- `/CLAUDE.md` - Project coding guidelines
- `/docs/AUTOFIXER_STATUS.md` - Component validation status
- `/README.md` - Project setup and overview
