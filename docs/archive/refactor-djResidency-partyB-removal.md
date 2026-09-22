# Refactor: Remove partyB Fields from DJ Residency Contract

## Goal

Remove the 6 redundant `partyB*` fields from the DJ Residency contract. The venue IS a counterparty (type: `'venue'`). Use `counterpartyId` to reference it, fetch counterparty data when needed, and support inline venue creation (like Equipment Rental does for clients).

## Files to Modify (9 files)

---

### Phase 1: Schema + Types (no dependencies)

**1A. `src/lib/schemas/v2/contracts/djResidency.ts`**
- Remove the 6 `partyB*` fields from `djResidencyContractSchema`: `partyBCompanyVietnamese`, `partyBCompanyEnglish`, `partyBAddress`, `partyBTaxCode`, `partyBRepresentative`, `partyBRepresentativePosition`
- The input schema (uses `.omit()`) inherits the removal automatically

**1B. `src/lib/types/v2/contracts.ts`**
- Remove the 6 `partyB*` fields from the `DjResidencyContract` interface

---

### Phase 2: Form State (depends on Phase 1)

**2. `src/lib/state/v2/djResidencyContractFormState.svelte.ts`**
- Remove 6 `partyB*` state fields
- Remove `fillFromCounterparty()` method entirely
- Remove `VenueCounterparty` import (only used by deleted method)
- Remove `partyB*` lines from `init()` and `reset()` methods
- Add `newCounterpartyBankName` and `newCounterpartyBankAccountNumber` fields (needed for inline venue creation, currently missing vs Equipment Rental)
- Add bank fields to `resetNewCounterpartyForm()`

---

### Phase 3: Generalize CreateCounterpartyInline (no dependencies)

**3. `src/lib/components/v2/contracts/sections/CreateCounterpartyInline.svelte`**
- Currently hardcoded to `EquipmentRentalContractFormState` type and "Create New Client" text
- Extract a shared interface for the `newCounterparty*` fields (both form states use identical field names):
  ```typescript
  interface InlineCounterpartyFormState {
    newCounterpartyName: string;
    newCounterpartyEmail: string;
    newCounterpartyPhone: string;
    newCounterpartyAddress: string;
    newCounterpartyCompanyName: string;
    newCounterpartyTaxId: string;
    newCounterpartyRepresentativeName: string;
    newCounterpartyRepresentativePosition: string;
    newCounterpartyBankName: string;
    newCounterpartyBankAccountNumber: string;
    isCreatingCounterparty: boolean;
  }
  ```
- Add `title` prop (default: `"Create New Client"`) and `createButtonLabel` prop (default: `"Create Client"`)
- Replace hardcoded strings with prop values
- Existing Equipment Rental usage continues to work (structurally compatible)

---

### Phase 4: Form Component + Contract Generator (depends on Phases 1-3)

**4A. `src/lib/components/v2/contracts/DjResidencyForm.svelte`**
- Remove the entire "Venue Details (Party B)" form section (6 input fields)
- Remove `handleCounterpartyChange()` function and its `onchange` binding
- Add "+ Create New" button next to venue dropdown (following Equipment Rental pattern)
- Add `CreateCounterpartyInline` component with `title="Create New Venue"` / `createButtonLabel="Create Venue"`
- Add `handleCreateCounterparty()` function that creates a `VenueCounterpartyInput` and calls `saveCounterparty()`
- Remove `partyB*` fields from `handleSubmit()` contract data object
- Add needed imports: `saveCounterparty`, `venueCounterpartySchema`, `Timestamp`, `CreateCounterpartyInline`

**4B. `src/lib/utils/djResidencyContractGenerator.ts`**
- Change signature: `generateDjResidencyContract(contract, venueCounterparty: VenueCounterparty)`
- Update `doc.render()` to source Party B template values from `venueCounterparty`:
  - `partyBCompanyVietnamese/English` <- `counterparty.ownerCompany || counterparty.venueName || counterparty.name`
  - `partyBAddressLine1` <- `counterparty.venueAddress || counterparty.address`
  - `partyBTaxCode` <- `counterparty.taxCode`
  - `partyBRepresentative` <- `counterparty.representativeName`
  - `partyBRepresentativePosition` <- `counterparty.representativePosition`
- Template `.docx` placeholders stay unchanged

---

### Phase 5: Detail Page + Monthly Invoice (depends on Phases 1, 4B)

**5A. `src/routes/contracts/dj-residency/[id]/+page.ts`**
- Fetch counterparty via `getCounterpartyById(contract.counterpartyId)` after loading contract
- Return `{ contract, venueCounterparty }` in page data

**5B. `src/routes/contracts/dj-residency/[id]/+page.svelte`**
- Display venue info from `data.venueCounterparty` instead of `data.contract.partyB*`
- Pass `data.venueCounterparty` to `generateDjResidencyContract()` for downloads
- Pass `venueCounterparty` prop to `DjResidencyMonthlyInvoice`

**5C. `src/lib/components/v2/contracts/DjResidencyMonthlyInvoice.svelte`**
- Add `venueCounterparty: VenueCounterparty` prop
- Replace 3 references to `contract.partyB*`:
  - Line 248: `contract.partyBCompanyEnglish` -> counterparty name (for `jobContent`)
  - Line 260: `contract.partyBAddress` -> counterparty address (for `clientAddress` fallback)
  - Line 264: `contract.partyBAddress` -> counterparty address (for `eventLocation`)

---

## No Changes Needed

- **`DjResidencyPerformanceLog.svelte`** - no partyB references
- **`djResidencyContracts.ts`** (CRUD utils) - no partyB field references
- **Edit page load function** - form loads counterparties via its own subscription
- **Template `.docx` file** - placeholders stay the same
- **Firestore data** - existing partyB fields in documents are silently ignored (not validated on read)

## Verification

1. `pnpm check` - 0 errors, 0 warnings
2. Svelte autofixer on: `DjResidencyForm.svelte`, `DjResidencyMonthlyInvoice.svelte`, `CreateCounterpartyInline.svelte`, detail `+page.svelte`
3. Browser test: create contract (existing venue + inline venue creation), edit, view detail, download docx, generate monthly invoice
