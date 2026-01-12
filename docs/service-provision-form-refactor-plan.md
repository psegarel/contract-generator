# Service Provision Form Refactor Plan

**Created:** 2026-01-09  
**Status:** Ready for Implementation  
**Estimated Effort:** 4-6 hours  
**Last Updated:** 2026-01-09

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

The `ServiceProvisionForm` component has accumulated technical debt:
- **Too large** - 539 lines, handles too many concerns
- **Uses $effect anti-pattern** - Syncing props to state via `$effect` (3 instances)
- **Uses callbacks instead of $bindable** - All section components use callback props
- **Doesn't use TextField component** - Raw input elements throughout
- **Doesn't use form state class** - Despite `ServiceProvisionContractFormState` existing

### Goals

1. **Break into smaller components** - Each component does one thing well
2. **Remove $effect anti-patterns** - Use form state class with `onMount` initialization
3. **Use $bindable instead of callbacks** - Modern Svelte 5 two-way binding
4. **Adopt TextField component** - Consistent input styling and behavior
5. **Use form state class** - Centralized state management

### Impact

**Before Refactor:**
- 1 monolithic form component (539 lines)
- 3 `$effect` anti-patterns for prop-to-state syncing
- 4 section components using callback props
- Raw input elements (inconsistent styling)
- State scattered across component

**After Refactor:**
- 1 main form component (~150 lines)
- 5-6 focused sub-components (~50-100 lines each)
- Zero `$effect` anti-patterns
- All components use `$bindable` for two-way binding
- Consistent TextField usage throughout
- Centralized state in form state class

---

## Current Issues

### 1. Component Size
- **Location:** `src/lib/components/v2/contracts/ServiceProvisionForm.svelte`
- **Problem:** 539 lines handling contract basics, service details, financials, banking, client info, provider creation, and submission
- **Impact:** Hard to maintain, test, and understand

### 2. $effect Anti-Patterns
- **Lines 75-102:** Syncing contract prop to form state
- **Lines 105-123:** Auto-filling from service provider selection
- **Lines 126-132:** Auto-generating contract number
- **Problem:** Using `$effect` for prop-to-state syncing breaks Svelte's reactivity model
- **Impact:** Potential race conditions, unnecessary re-renders, harder to reason about

### 3. Callback Props
- **Location:** All section components (`ServiceDetailsSection`, `FinancialSection`, `BankingSection`, `ClientInfoSection`)
- **Problem:** Using callbacks like `onjobNameChange`, `oncontractValueChange` instead of `$bindable`
- **Impact:** More verbose, less idiomatic Svelte 5 code

### 4. No TextField Usage
- **Problem:** Raw `<input>` elements with duplicated styling
- **Impact:** Inconsistent UI, harder to maintain styling

### 5. Not Using Form State Class
- **Problem:** Despite `ServiceProvisionContractFormState` existing, form uses local `$state` variables
- **Impact:** Duplicated state management logic, harder to test

---

## Refactor Goals

### Primary Goals

1. **Component Architecture**
   - Main form component: ~150 lines (orchestration only)
   - Sub-components: 5-6 focused components (~50-100 lines each)
   - Each component does one thing well

2. **State Management**
   - Use `ServiceProvisionContractFormState` class
   - Initialize with `onMount` (not `$effect`)
   - All form fields bound to state class properties

3. **Modern Svelte 5 Patterns**
   - Zero `$effect` anti-patterns
   - Use `$bindable` for two-way binding
   - Use `$derived` for computed values
   - Use `$effect` only for legitimate side effects (eventState/counterpartyState lifecycle)

4. **Component Reusability**
   - Use `TextField` component throughout
   - Consistent styling and behavior
   - Easier to maintain and update

### Secondary Goals

- Improve type safety
- Better error handling
- Consistent code style
- Easier to test

---

## Implementation Plan

### Phase 1: Update TextField Component

**File:** `src/lib/components/TextField.svelte`

**Changes:**
- Remove `onInput` callback prop
- Add `value = $bindable('')` prop
- Use `bind:value` in template instead of `oninput` handler

**Rationale:** TextField isn't used anywhere yet, so safe to update directly. This enables modern two-way binding.

**Estimated Time:** 15 minutes

---

### Phase 2: Update Section Components to Use Form State

**Files:**
- `src/lib/components/v2/contracts/sections/ServiceDetailsSection.svelte`
- `src/lib/components/v2/contracts/sections/FinancialSection.svelte`
- `src/lib/components/v2/contracts/sections/BankingSection.svelte`
- `src/lib/components/v2/contracts/sections/ClientInfoSection.svelte`

**Changes:**
- Remove all callback props (`onjobNameChange`, `oncontractValueChange`, etc.)
- Add `formState: ServiceProvisionContractFormState` prop
- Use `bind:value={formState.fieldName}` directly
- Remove callback handlers

**Rationale:** Simplifies API, uses modern Svelte 5 patterns, reduces boilerplate.

**Estimated Time:** 30 minutes

---

### Phase 3: Create New Sub-Components

**New Components:**

1. **ContractBasicsSection.svelte**
   - Contract number, status, event selection, counterparty selection, payment status
   - Includes "Create New Provider" toggle button
   - ~80-100 lines

2. **CreateProviderForm.svelte**
   - Inline form for creating new service provider
   - Name, service type, email, phone fields
   - Create/Cancel buttons
   - ~60-80 lines

3. **NotesSection.svelte**
   - Simple textarea for internal notes
   - ~30-40 lines

**Rationale:** Breaks down main form into focused, reusable components.

**Estimated Time:** 1.5-2 hours

---

### Phase 4: Refactor Main Form Component

**File:** `src/lib/components/v2/contracts/ServiceProvisionForm.svelte`

**Changes:**

1. **State Management:**
   - Remove all local `$state` variables
   - Create `formState` instance: `const formState = new ServiceProvisionContractFormState()`
   - Initialize in `onMount`: `formState.init(contract, initialEventId)`

2. **Remove $effect Anti-Patterns:**
   - Remove lines 75-102 (contract prop syncing) - handled by `formState.init()`
   - Remove lines 126-132 (contract number generation) - handled by `formState.init()`
   - Handle auto-fill via component logic (see Technical Considerations)

3. **Event/Counterparty State:**
   - Keep `$effect` for `eventState.init()` and `counterpartyState.init()` (legitimate side effects)
   - Or move to `onMount`/`onDestroy` if one-time initialization

4. **Component Usage:**
   - Replace inline form sections with new sub-components
   - Pass `formState` to all section components
   - Use `TextField` where appropriate

5. **Auto-Fill Logic:**
   - Handle service provider auto-fill when `counterpartyId` changes
   - Use `$derived` to get selected provider
   - Call `formState.fillFromServiceProvider()` in appropriate handler
   - Only for new contracts (not when editing)

6. **Submission Logic:**
   - Update to use `formState` properties
   - Keep validation and error handling
   - Use `formState.isSubmitting` and `formState.error`

**Estimated Time:** 2-2.5 hours

---

### Phase 5: Testing & Validation

**Tasks:**
1. Run Svelte autofixer on all modified components
2. Run `pnpm check` - ensure 0 errors and 0 warnings
3. Test form submission (create new contract)
4. Test form editing (edit existing contract)
5. Test auto-fill from service provider
6. Test create new provider inline
7. Test validation errors
8. Test all form fields bind correctly

**Estimated Time:** 1 hour

---

## Component Breakdown

### Main Form Component

**ServiceProvisionForm.svelte** (~150 lines)
- Props: `contract`, `initialEventId`, `onSuccess`, `onCancel`
- State: `formState` instance, `events`, `serviceProviders` (derived)
- Logic: Initialization, submission, provider creation
- Sections: Orchestrates all sub-components

### Sub-Components

**ContractBasicsSection.svelte** (~80-100 lines)
- Contract number input
- Status select
- Event select
- Service provider select + "Create New" button
- Payment status select
- Props: `formState`, `events`, `serviceProviders`, `onToggleCreateProvider`

**CreateProviderForm.svelte** (~60-80 lines)
- Provider name input
- Service type input
- Email input
- Phone input
- Create/Cancel buttons
- Props: `formState`, `onCreate`, `onCancel`

**ServiceDetailsSection.svelte** (~100 lines)
- Job name, job content, number of performances
- First performance time, start date, end date
- Event location
- Props: `formState`

**FinancialSection.svelte** (~80 lines)
- Contract value input
- Tax rate input
- Calculated gross amount display
- Props: `formState`

**BankingSection.svelte** (~50 lines)
- Bank name input
- Account number input
- Props: `formState`

**ClientInfoSection.svelte** (~80 lines)
- Client email, phone, address
- Client ID document, tax ID
- Props: `formState`

**NotesSection.svelte** (~30-40 lines)
- Notes textarea
- Props: `formState`

---

## Technical Considerations

### Auto-Fill from Service Provider

**Current Approach (Anti-Pattern):**
```svelte
$effect(() => {
  if (contract) return;
  if (counterpartyId && serviceProviders.length > 0) {
    const selectedProvider = serviceProviders.find(...);
    if (selectedProvider) {
      clientEmail = selectedProvider.email || '';
      // ... more assignments
    }
  }
});
```

**New Approach (Component Logic):**
```svelte
// Get selected provider (derived)
const selectedProvider = $derived(
  formState.counterpartyId && serviceProviders.length > 0
    ? serviceProviders.find(c => c.id === formState.counterpartyId)
    : null
);

// Handle counterparty change
function handleCounterpartyChange() {
  // Only auto-fill for new contracts
  if (!contract && selectedProvider) {
    formState.fillFromServiceProvider(selectedProvider);
  }
}
```

**In Template:**
```svelte
<select bind:value={formState.counterpartyId} onchange={handleCounterpartyChange}>
  <!-- options -->
</select>
```

**Alternative (if needed):**
- Use `$effect` only for the auto-fill logic, but document why it's necessary
- Prefer component handler approach first

### Event/Counterparty State Initialization

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

**Consideration:** This is a legitimate use of `$effect` (side effects with cleanup). However, if these are one-time initializations, `onMount`/`onDestroy` might be clearer:

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

**Decision:** Keep `$effect` if state needs to re-initialize on prop changes, otherwise use `onMount`/`onDestroy`.

### TextField Usage

**Where to Use:**
- All text inputs (contract number, job name, client email, etc.)
- Consider for number inputs (contract value, tax rate) - may need `NumberField` variant
- Consider for textarea (notes, job content) - may need `TextareaField` component

**Where NOT to Use:**
- Select dropdowns (keep as-is)
- Date/time inputs (keep as-is, or create `DateField` if needed)

### Form State Class Methods

**Available Methods:**
- `init(contract, initialEventId)` - Initialize from contract or reset
- `reset()` - Reset to empty state
- `fillFromServiceProvider(provider)` - Auto-fill client details
- `resetNewProviderForm()` - Reset inline provider form

**Usage:**
- Call `init()` in `onMount`
- Call `fillFromServiceProvider()` when counterparty changes (new contracts only)
- Call `resetNewProviderForm()` after creating provider

---

## Testing Strategy

### Unit Testing

1. **Form State Class:**
   - Test `init()` with contract data
   - Test `init()` with null (new contract)
   - Test `reset()`
   - Test `fillFromServiceProvider()`
   - Test `resetNewProviderForm()`

2. **Component Testing:**
   - Test form renders all sections
   - Test form initializes with contract data
   - Test form initializes empty for new contract
   - Test auto-fill triggers correctly
   - Test validation errors display
   - Test submission flow

### Integration Testing

1. **Create New Contract:**
   - Fill all required fields
   - Select event and service provider
   - Verify auto-fill works
   - Submit form
   - Verify contract created in Firestore

2. **Edit Existing Contract:**
   - Load form with contract data
   - Verify all fields populated
   - Modify fields
   - Submit form
   - Verify contract updated in Firestore

3. **Create Provider Inline:**
   - Click "Create New Provider"
   - Fill provider form
   - Submit provider
   - Verify provider created and selected
   - Verify auto-fill works with new provider

### Manual Testing Checklist

- [ ] Form loads with empty state (new contract)
- [ ] Form loads with contract data (edit contract)
- [ ] All input fields bind correctly
- [ ] Auto-fill works when selecting service provider (new contracts only)
- [ ] Auto-fill doesn't trigger when editing existing contract
- [ ] Contract number auto-generates for new contracts
- [ ] Create provider inline form works
- [ ] Validation errors display correctly
- [ ] Form submission works (create)
- [ ] Form submission works (update)
- [ ] All section components render correctly
- [ ] TextField components work correctly
- [ ] No console errors or warnings
- [ ] TypeScript checks pass (0 errors, 0 warnings)

---

## Success Metrics

### Code Quality

- [ ] Main form component under 200 lines
- [ ] All sub-components under 150 lines
- [ ] Zero `$effect` anti-patterns
- [ ] All components use `$bindable` where appropriate
- [ ] TextField used consistently
- [ ] Form state class used for all state management

### Type Safety

- [ ] `pnpm check` passes with 0 errors
- [ ] `pnpm check` passes with 0 warnings
- [ ] All components pass Svelte autofixer

### Functionality

- [ ] All form fields work correctly
- [ ] Auto-fill works as expected
- [ ] Form submission works (create and update)
- [ ] Validation works correctly
- [ ] No regressions in existing functionality

### Maintainability

- [ ] Components are focused and single-purpose
- [ ] Code is easy to understand
- [ ] Patterns are consistent with rest of codebase
- [ ] Follows documented best practices

---

## Implementation Order

1. **Phase 1:** Update TextField (15 min)
2. **Phase 2:** Update section components (30 min)
3. **Phase 3:** Create new sub-components (1.5-2 hours)
4. **Phase 4:** Refactor main form (2-2.5 hours)
5. **Phase 5:** Testing & validation (1 hour)

**Total Estimated Time:** 4-6 hours

---

## Notes

- TextField component is not currently used anywhere, so safe to update directly
- Form state class already exists and is well-designed
- Pattern matches `ServiceProviderForm` which is working well
- Consider creating `NumberField` and `TextareaField` variants if needed
- Keep eventState/counterpartyState initialization pattern consistent with other forms

---

## References

- Form State Class Pattern: `CLAUDE.md` (lines 158-247)
- ServiceProviderForm Example: `src/lib/components/v2/counterparties/ServiceProviderForm.svelte`
- Form State Class: `src/lib/state/v2/serviceProvisionContractFormState.svelte.ts`
- Current Form: `src/lib/components/v2/contracts/ServiceProvisionForm.svelte`
