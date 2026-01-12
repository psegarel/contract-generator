# Event Planning Form Refactor Plan

**Created:** 2026-01-12
**Status:** Ready for Implementation
**Estimated Effort:** 3-4 hours
**Last Updated:** 2026-01-12

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Issues](#current-issues)
3. [Refactor Goals](#refactor-goals)
4. [Implementation Plan](#implementation-plan)
5. [Component Breakdown](#component-breakdown)
6. [Technical Considerations](#technical-considerations)
7. [Testing Strategy](#testing-strategy)
8. [Success Metrics](#success-metrics)

---

## Executive Summary

### Current State

The `EventPlanningForm` component has accumulated significant technical debt:
- **Too large** - 476 lines, handles too many concerns
- **Uses $effect anti-patterns** - 4 instances syncing props to state (lines 26, 78, 142, 161)
- **Uses callbacks instead of formState** - All 5 section components use callback props
- **40+ local $state variables** - State scattered throughout component
- **Complex v1/v2 data handling** - Uses `any` types and helper functions for backward compatibility
- **Doesn't use form state class** - Despite pattern established in ServiceProvisionForm

### Goals

1. **Break into smaller components** - Extract Contract Basics section to separate component
2. **Remove $effect anti-patterns** - Use form state class with `onMount` initialization
3. **Use formState pattern** - All section components bind to centralized state
4. **Create EventPlanningContractFormState class** - Centralized state management
5. **Simplify main component** - Reduce from 476 to ~150-200 lines

### Impact

**Before Refactor:**
- 1 monolithic form component (476 lines)
- 4 `$effect` anti-patterns for prop-to-state syncing
- 5 section components using callback props
- 40+ local `$state` variables scattered throughout
- Complex v1/v2 compatibility code with `any` types

**After Refactor:**
- 1 main form component (~150-200 lines)
- 6 focused sub-components
- Zero `$effect` anti-patterns
- All components use `formState` pattern
- Centralized state in form state class
- Clean v2-only data handling

---

## Current Issues

### 1. Component Size
- **Location:** `src/lib/components/v2/contracts/EventPlanningForm.svelte`
- **Problem:** 476 lines handling contract basics, client info, event info, financials, timeline, legal terms, and submission
- **Impact:** Hard to maintain, test, and understand

### 2. $effect Anti-Patterns

**Pattern 1: State/Counterparty Initialization (Lines 26-32)**
```svelte
$effect(() => {
    eventState.init();
    counterpartyState.init();
    return () => {
        eventState.destroy();
        counterpartyState.destroy();
    };
});
```
- **Issue:** This is actually a **legitimate use** of $effect (lifecycle management with cleanup)
- **Action:** Keep this one, but move to `onMount`/`onDestroy` for clarity

**Pattern 2: Contract Prop Syncing (Lines 78-139)**
```svelte
$effect(() => {
    if (contract) {
        // 60+ lines of assignments syncing contract prop to local state
        contractNumber = contract.contractNumber ?? '';
        contractDate = getValue<string>('contractDate');
        // ... 35+ more field assignments
    }
});
```
- **Problem:** Classic $effect anti-pattern - syncing props to state
- **Impact:** Creates reactive dependency chains, hard to reason about
- **Solution:** Use `formState.init(contract)` in `onMount`

**Pattern 3: Client Auto-fill (Lines 142-158)**
```svelte
$effect(() => {
    if (contract) return;
    if (counterpartyId && clients.length > 0) {
        const selectedClient = clients.find(...);
        clientCompany = selectedClient.companyName || selectedClient.name;
        // ... more assignments
    }
});
```
- **Problem:** Watching state changes and mutating other state
- **Solution:** Handle as direct event handler on client selection

**Pattern 4: Contract Number Generation (Lines 161-167)**
```svelte
$effect(() => {
    if (!contract && !contractNumber) {
        const dateStr = new Date().toISOString()...;
        contractNumber = `EVT-${dateStr}-${timestamp}`;
    }
});
```
- **Problem:** State initialization should happen in `init()` method
- **Solution:** Move to `formState.init()` or `generateContractNumber()` method

### 3. Callback Props

All section components use callback props instead of binding to formState:

**EventPlanningClientSection:**
```svelte
onclientCompanyChange={(value) => (clientCompany = value)}
onclientAddressChange={(value) => (clientAddress = value)}
// ... 3 more callbacks
```

**EventPlanningEventInfoSection:**
```svelte
oneventThemeChange={(value) => (eventTheme = value)}
oneventTypeChange={(value) => (eventType = value)}
// ... 5 more callbacks
```

Similar patterns in:
- EventPlanningFinancialSection (6 callbacks)
- EventPlanningTimelineSection (7 callbacks)
- EventPlanningLegalSection (5 callbacks)

**Total:** 28 callback props across 5 components

### 4. No Form State Class

Despite having 40+ form fields, there's no centralized state management class like we created for ServiceProvisionForm.

### 5. Complex v1/v2 Data Handling

Lines 80-98 contain complex helper functions to handle both v1 (nested `contractData`) and v2 (flat) contract structures:

```typescript
const contractData = (contract as any).contractData;
const isV1Structure = !!contractData;

const getValue = <T>(v1Key: string, v2Key?: string): T => {
    if (isV1Structure && contractData) {
        return (contractData[v1Key] ?? (contract as any)[v2Key || v1Key]) as T;
    }
    return ((contract as any)[v2Key || v1Key] ?? '') as T;
};
```

- **Problem:** Uses `any` types, complex logic, maintains backward compatibility we may not need
- **Impact:** Harder to maintain, defeats TypeScript's purpose
- **Solution:** Simplify to v2-only or create proper typed migration

---

## Refactor Goals

### Primary Goals

1. **Component Architecture**
   - Main form component: ~150-200 lines (orchestration only)
   - Sub-components: 6 focused components
   - Each component does one thing well

2. **State Management**
   - Create `EventPlanningContractFormState` class
   - Initialize with `onMount` (not `$effect`)
   - All form fields bound to state class properties

3. **Modern Svelte 5 Patterns**
   - Zero `$effect` anti-patterns
   - Use `formState` pattern for section components
   - Use `$derived` for computed values
   - Use `onMount`/`onDestroy` for lifecycle management

4. **Simplified Data Handling**
   - Remove v1/v2 compatibility code if not needed
   - Or create proper typed migration utilities
   - No `any` types

### Secondary Goals

- Improve type safety
- Better error handling
- Consistent code style with ServiceProvisionForm
- Easier to test

---

## Implementation Plan

### Phase 1: Create EventPlanningContractFormState Class

**File:** `src/lib/state/v2/eventPlanningContractFormState.svelte.ts` (NEW)

**Fields:** All 40+ form fields as `$state` properties

**Methods:**
- `init(contract, initialEventId?)` - Initialize from contract or reset
- `reset()` - Reset to empty state
- `fillFromClient(client)` - Auto-fill client details
- `generateContractNumber()` - Generate unique contract number

**Estimated Time:** 45 minutes

---

### Phase 2: Extract Contract Basics Section

**File:** `src/lib/components/v2/contracts/sections/EventPlanningContractBasicsSection.svelte` (NEW)

**Content:**
- Contract number input
- Contract date input
- Contract location input
- Event select
- Client select
- Payment status select

**Props:**
- `formState: EventPlanningContractFormState`
- `events: Event[]`
- `clients: ClientCounterparty[]`
- `onClientChange?: () => void` - For auto-fill trigger

**Estimated Time:** 30 minutes

---

### Phase 3: Update Section Components to Use FormState

Update all 5 existing section components to use formState pattern:

**Files:**
1. `EventPlanningClientSection.svelte`
2. `EventPlanningEventInfoSection.svelte`
3. `EventPlanningFinancialSection.svelte`
4. `EventPlanningTimelineSection.svelte`
5. `EventPlanningLegalSection.svelte`

**Changes for each:**
- Remove all callback props
- Add `formState: EventPlanningContractFormState` prop
- Use `bind:value={formState.fieldName}` directly
- Remove callback handlers

**Estimated Time:** 1 hour (12 minutes per component)

---

### Phase 4: Refactor Main Form Component

**File:** `src/lib/components/v2/contracts/EventPlanningForm.svelte`

**Changes:**

1. **State Management:**
   - Remove all 40+ local `$state` variables
   - Create `formState` instance
   - Initialize in `onMount`: `formState.init(contract)`

2. **Remove $effect Anti-Patterns:**
   - **Lines 26-32:** Move to `onMount`/`onDestroy` for clarity
   - **Lines 78-139:** Remove - handled by `formState.init()`
   - **Lines 142-158:** Replace with `onClientChange` event handler
   - **Lines 161-167:** Remove - handled by `formState.init()`

3. **Event/Counterparty State:**
   - Move from `$effect` to `onMount`/`onDestroy`
   - Or keep `$effect` if state needs reactive re-initialization

4. **Component Usage:**
   - Replace inline Contract Basics section with new component
   - Pass `formState` to all section components
   - Remove all callback props

5. **Client Auto-Fill Logic:**
   - Handle as event handler on client selection change
   - Pass handler to ContractBasicsSection
   - Only for new contracts (not when editing)

6. **Submission Logic:**
   - Update to use `formState` properties
   - Remove v1/v2 compatibility helpers if not needed
   - Keep validation and error handling

**Estimated Time:** 1.5-2 hours

---

### Phase 5: Testing & Validation

**Tasks:**
1. Run Svelte autofixer on all modified components
2. Run `pnpm check` - ensure 0 errors and 0 warnings
3. Test form submission (create new contract)
4. Test form editing (edit existing contract)
5. Test auto-fill from client selection
6. Test validation errors
7. Test all form fields bind correctly

**Estimated Time:** 30-45 minutes

---

## Component Breakdown

### Main Form Component

**EventPlanningForm.svelte** (~150-200 lines)
- Props: `contract`, `onSuccess`, `onCancel`
- State: `formState` instance, `events`, `clients` (derived)
- Logic: Initialization, submission
- Sections: Orchestrates all sub-components

### Sub-Components

**EventPlanningContractBasicsSection.svelte** (~100 lines) - NEW
- Contract number, date, location
- Event select
- Client select + auto-fill trigger
- Payment status
- Props: `formState`, `events`, `clients`, `onClientChange`

**EventPlanningClientSection.svelte** (~80 lines)
- Company name, address, tax code
- Representative name and position
- Props: `formState`

**EventPlanningEventInfoSection.svelte** (~100 lines)
- Event theme, type, description
- Event venue, date, duration
- Expected attendance
- Props: `formState`

**EventPlanningFinancialSection.svelte** (~120 lines)
- Contract value, VAT rate
- Deposit and final payment percentages
- Professional indemnity and public liability amounts
- Calculated totals display
- Props: `formState`

**EventPlanningTimelineSection.svelte** (~120 lines)
- Planning meeting days
- Performer booking deadline
- Technical setup date
- Event execution date, time, duration
- Breakdown completion date/time
- Props: `formState`

**EventPlanningLegalSection.svelte** (~90 lines)
- Payment grace period days
- Termination notice days
- Negotiation period days
- Arbitration location and language
- Props: `formState`

**NotesSection** (inline in main form) (~20 lines)
- Simple textarea for internal notes
- No need to extract

---

## Technical Considerations

### Client Auto-Fill Pattern

**Current Approach (Anti-Pattern):**
```svelte
$effect(() => {
    if (contract) return;
    if (counterpartyId && clients.length > 0) {
        const selectedClient = clients.find(...);
        clientCompany = selectedClient.companyName || selectedClient.name;
        // ... more assignments
    }
});
```

**New Approach (Event Handler):**
```svelte
// Handle client change - auto-fill details for new contracts only
function handleClientChange() {
    // Only auto-fill for new contracts
    if (!contract && formState.counterpartyId && clients.length > 0) {
        const selectedClient = clients.find(c => c.id === formState.counterpartyId);
        if (selectedClient) {
            formState.fillFromClient(selectedClient);
        }
    }
}
```

**In ContractBasicsSection:**
```svelte
<select
    id="counterpartyId"
    bind:value={formState.counterpartyId}
    onchange={() => onClientChange?.()}
    ...
>
```

### v1/v2 Data Compatibility

**Option 1: Remove Compatibility Code (Recommended if v1 not used)**
```typescript
// Simple v2-only init
init(contract: EventPlanningContract | null) {
    if (!contract) {
        this.reset();
        this.generateContractNumber();
        return;
    }

    this.contractNumber = contract.contractNumber ?? '';
    this.contractDate = contract.contractDate ?? '';
    // ... direct property access
}
```

**Option 2: Create Typed Migration Utility**
```typescript
// utils/v2/contractMigration.ts
export function normalizeEventPlanningContract(
    contract: EventPlanningContract | LegacyEventPlanningContract
): EventPlanningContract {
    // Type-safe migration logic
}
```

**Decision:** Check with user if v1 contracts still exist in database.

### State/Counterparty Lifecycle

**Current:**
```svelte
$effect(() => {
    eventState.init();
    counterpartyState.init();
    return () => {
        eventState.destroy();
        counterpartyState.destroy();
    };
});
```

**Recommended (clearer intent):**
```svelte
onMount(() => {
    eventState.init();
    counterpartyState.init();
});

onDestroy(() => {
    eventState.destroy();
    counterpartyState.destroy();
});
```

**Or keep $effect if:** State needs to re-initialize when props change (unlikely for this use case).

### Contract Number Generation

**Current Approach:**
```svelte
$effect(() => {
    if (!contract && !contractNumber) {
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const timestamp = Date.now().toString().slice(-4);
        contractNumber = `EVT-${dateStr}-${timestamp}`;
    }
});
```

**New Approach (in FormState class):**
```typescript
private generateContractNumber() {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const timestamp = Date.now().toString().slice(-4);
    this.contractNumber = `EVT-${dateStr}-${timestamp}`;
}

init(contract: EventPlanningContract | null) {
    if (!contract) {
        this.reset();
        this.generateContractNumber(); // Called once during initialization
        return;
    }
    // ... load contract data
}
```

---

## Testing Strategy

### Unit Testing (Future)

1. **Form State Class:**
   - Test `init()` with contract data
   - Test `init()` with null (new contract)
   - Test `reset()`
   - Test `fillFromClient()`
   - Test `generateContractNumber()`

2. **Component Testing:**
   - Test form renders all sections
   - Test form initializes with contract data
   - Test form initializes empty for new contract
   - Test auto-fill triggers correctly
   - Test validation errors display
   - Test submission flow

### Manual Testing Checklist

**Basic Functionality:**
- [ ] Form loads with empty state (new contract)
- [ ] Form loads with contract data (edit contract)
- [ ] All input fields bind correctly (40+ fields)
- [ ] Contract number auto-generates for new contracts
- [ ] Contract number preserved when editing

**Auto-fill:**
- [ ] Auto-fill works when selecting client (new contracts only)
- [ ] Auto-fill doesn't trigger when editing existing contract
- [ ] Client company name, address, tax code populate correctly
- [ ] Client representative name and position populate correctly

**Sections:**
- [ ] Contract Basics section works
- [ ] Client Information section works
- [ ] Event Information section works
- [ ] Financial Terms section works
- [ ] Timeline section works
- [ ] Legal Terms section works
- [ ] Notes section works

**Submission:**
- [ ] Validation errors display correctly
- [ ] Form submission works (create)
- [ ] Form submission works (update)
- [ ] Success callback fires
- [ ] Error handling displays correctly

**Technical:**
- [ ] No console errors or warnings
- [ ] TypeScript checks pass (`pnpm check` - 0 errors, 0 warnings)
- [ ] Autofixer validation passes
- [ ] No $effect anti-patterns remain

---

## Success Metrics

### Code Quality

- [ ] Main form component under 200 lines (currently 476)
- [ ] All sub-components under 150 lines
- [ ] Zero `$effect` anti-patterns (currently 4)
- [ ] Form state class used for all state management
- [ ] No `any` types (currently used for v1/v2 compatibility)

### Type Safety

- [ ] `pnpm check` passes with 0 errors
- [ ] `pnpm check` passes with 0 warnings
- [ ] All components pass Svelte autofixer

### Functionality

- [ ] All 40+ form fields work correctly
- [ ] Auto-fill works as expected
- [ ] Form submission works (create and update)
- [ ] Validation works correctly
- [ ] No regressions in existing functionality

### Maintainability

- [ ] Components are focused and single-purpose
- [ ] Code is easy to understand
- [ ] Patterns consistent with ServiceProvisionForm refactor
- [ ] Follows documented best practices in CLAUDE.md

---

## Implementation Order

1. **Phase 1:** Create EventPlanningContractFormState class (45 min)
2. **Phase 2:** Extract ContractBasicsSection component (30 min)
3. **Phase 3:** Update 5 section components to use formState (1 hour)
4. **Phase 4:** Refactor main form component (1.5-2 hours)
5. **Phase 5:** Testing & validation (30-45 min)

**Total Estimated Time:** 3-4 hours

---

## Notes

- Follow same pattern as ServiceProvisionForm refactor (completed 2026-01-12)
- Decision needed: Keep v1/v2 compatibility or simplify to v2-only?
- Consider extracting Notes section if used in multiple forms
- All section components already exist - just need to update to formState pattern
- Main work is creating FormState class and updating main component

---

## References

- ServiceProvisionForm Refactor: `docs/service-provision-form-refactor-plan.md`
- Form State Class Pattern: `CLAUDE.md` (lines 158-247)
- ServiceProvisionForm Example: `src/lib/components/v2/contracts/ServiceProvisionForm.svelte`
- ServiceProvisionFormState: `src/lib/state/v2/serviceProvisionContractFormState.svelte.ts`
- Current EventPlanningForm: `src/lib/components/v2/contracts/EventPlanningForm.svelte`

---

**Last Updated:** 2026-01-12
**Reason:** Initial creation based on ServiceProvisionForm refactor success
