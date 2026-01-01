# Event Planning Services Contract Page - Implementation Plan

## Overview
Add a new contract type for Event Planning Services to the existing contract generator, following the same patterns as the DJ residency contract but with a more comprehensive field set for event planning.

## Architecture Principles 🏗️

**Component Design:**
- ✅ **Small components** - Each component should do one thing well
- ✅ **Sub-components** - Break large components into smaller, focused pieces
- ✅ **Dumb components** - Components should be presentational (receive props, emit events)
- ✅ **Externalized logic** - Business logic, calculations, and validations in utility functions

**Example:**
```
❌ BAD: One giant EventPlanningContractForm.svelte with 50 fields and all logic
✅ GOOD: 6 section components + 1 orchestrator + utilities file with business logic
```

## Template & Placeholders
- **Template file**: `static/event-planning-services-template.docx` (already exists)
- **Comprehensive placeholder list provided** with 50+ fields covering:
  - Contract metadata (number, dates, location)
  - Client information (Party A) - company, address, tax code, representative details, passport info
  - Event details - theme, name, type, description, venue, date, duration, attendance
  - Financial terms - contract value, VAT, deposits, insurance amounts
  - Timeline - meeting deadlines, setup dates, execution timing
  - Legal terms - grace periods, termination notice, arbitration details

## Step-by-Step Implementation Plan

### Phase 1: Type Definitions & Zod Schema ✅ CRITICAL
**Files to create:**
- `src/lib/schemas/eventPlanningContract.ts`

**Tasks:**
1. Create comprehensive Zod schema with 50+ fields matching the placeholder list
2. Organize fields into logical groups (contract info, client info, event info, financial, timeline, legal)
3. Add proper validation rules:
   - Required vs optional fields
   - Email validation for client emails
   - Number constraints (min/max for percentages, amounts)
   - Date validation
   - String min lengths for required text fields
4. Infer TypeScript type from schema: `export type EventPlanningContractData = z.infer<typeof eventPlanningContractSchema>`
5. Export both schema and type for use in form and repository

**Validation considerations:**
- VAT rate: 0-100%
- Deposit/final payment percentages: should sum to 100% (add custom refinement)
- Dates: ensure event date is after contract date
- Numbers: insurance amounts, contract value must be positive
- Tax code format validation if applicable

---

### Phase 2: Update Contract Repository
**Files to modify:**
- `src/lib/utils/ContractRepository.ts`
- `src/lib/utils/contracts.ts`

**Tasks:**
1. Update `SavedContract` interface to support union type discrimination
2. Update `ContractRepository.save()` method to accept `'event-planning'` as a valid contract type
3. Add wrapper function `saveEventPlanningContract()` in contracts.ts for type-safe saves
4. Ensure existing queries (getAll, getByLocationId) work for both contract types

**No breaking changes** - existing service contracts continue working as-is.

---

### Phase 3: Contract Generation Utility
**Files to create:**
- `src/lib/utils/eventPlanningContractGenerator.ts`

**Tasks:**
1. Create async function `generateEventPlanningContract(data: EventPlanningContractData): Promise<Blob>`
2. Follow same pattern as `serviceContractGenerator.ts`
3. **Bilingual support**: Auto-translate English inputs to Vietnamese using MyMemory API
4. **Date formatting**: Vietnamese and English formats
5. **Currency formatting**: Use Vietnamese locale for VND amounts
6. **Percentage formatting**: Display as percentages (e.g., "10%" not "0.1")

---

### Phase 4: Form Components & Business Logic (Largest Step)
**Files to create:**
- `src/lib/components/EventPlanningContractForm.svelte` (orchestrator component)
- `src/lib/components/event-planning/ContractInfoSection.svelte`
- `src/lib/components/event-planning/ClientInfoSection.svelte`
- `src/lib/components/event-planning/EventDetailsSection.svelte`
- `src/lib/components/event-planning/FinancialTermsSection.svelte`
- `src/lib/components/event-planning/TimelineSection.svelte`
- `src/lib/components/event-planning/LegalTermsSection.svelte`
- `src/lib/utils/eventPlanningFormHelpers.ts` (business logic utilities)

**Architecture Principles:**
- **Small components**: Each section component handles 4-15 related fields
- **Single responsibility**: Each component does one thing well (one section of the form)
- **Dumb components**: Components are presentational, receive data via props, emit changes via callbacks
- **Externalized logic**: Validation, computed values, data transformation in utility functions

**Sub-steps:**
- 4a: Create utility functions in `eventPlanningFormHelpers.ts` (calculations, validation)
- 4b: Create 6 section components (small, dumb, presentational)
- 4c: Create orchestrator component that composes sections
- 4d: Integrate ClientForm and LocationForm

---

### Phase 5: Route Pages
**Files to create:**
- `src/routes/contracts/event-planning/+page.svelte`

**Tasks:**
1. Create route page that renders `<EventPlanningContractForm>`
2. Wrap in `<AuthGuard>` component
3. Add page title and breadcrumb/back navigation

---

### Phase 6: Update Contract Type Selector
**Files to modify:**
- `src/routes/contracts/+page.svelte`

**Tasks:**
1. Add new card for "Event Planning Services" contract type
2. Link to `/contracts/event-planning`
3. Add appropriate icon (e.g., CalendarCheck, PartyPopper)

---

### Phase 7: Update Contract List Display
**Files to modify:**
- `src/lib/components/ContractList.svelte`

**Tasks:**
1. Update to handle both contract types in display
2. Add type badge/indicator (e.g., "Service" vs "Event Planning")
3. Show appropriate fields based on contract type
4. Ensure download button works for both types (regenerate from stored data)
5. Edit button links to correct form

---

## Implementation Order (Step-by-Step Incremental Approach)

**IMPORTANT**: Implement and test each step before moving to the next.

### Step 0: Documentation Setup (FIRST) 📝
- ✅ Create `docs/` folder in project root
- ✅ Save this implementation plan as `docs/event-planning-contract-implementation.md`

### Step 1: Foundation (Types & Schema) ⭐ START HERE
- Create `src/lib/schemas/eventPlanningContract.ts` with comprehensive Zod schema
- Define all 50+ fields with proper validation
- Export both schema and inferred TypeScript type
- **Deliverable**: Working schema that can validate event planning contract data

### Step 2: Repository Layer
- Update `src/lib/utils/ContractRepository.ts` to support `'event-planning'` type
- Add wrapper function in `src/lib/utils/contracts.ts`
- **Deliverable**: Can save and retrieve event planning contracts from Firebase

### Step 3: Generator Utility
- Create `src/lib/utils/eventPlanningContractGenerator.ts`
- Implement document generation with auto-translation
- **Deliverable**: Working document generation function

### Step 4: Form Components & Business Logic (Largest Step)
- 4a: Create utility functions (calculations, validation)
- 4b: Create 6 section components (small, dumb, presentational)
- 4c: Create orchestrator component
- 4d: Integrate ClientForm and LocationForm
- **Deliverable**: Complete form system with small, focused components

### Step 5: Routing & Integration
- Create route page
- Update contract type selector
- **Deliverable**: End-to-end contract creation flow working

### Step 6: List Display Updates
- Update ContractList to handle both types
- **Deliverable**: Both contract types display properly

### Step 7: Final Testing & Polish
- Comprehensive manual testing
- Run `pnpm check` for TypeScript errors
- Run autofixer to ensure zero suggestions
- **Deliverable**: Production-ready event planning contract feature

---

## Critical Files Summary

**New files to create (14):**
1. `src/lib/schemas/eventPlanningContract.ts` - Zod schema + type
2. `src/lib/utils/eventPlanningContractGenerator.ts` - DOCX generation
3. `src/lib/utils/eventPlanningFormHelpers.ts` - Business logic utilities
4. `src/lib/components/EventPlanningContractForm.svelte` - Orchestrator component
5. `src/lib/components/event-planning/ContractInfoSection.svelte` - Section component
6. `src/lib/components/event-planning/ClientInfoSection.svelte` - Section component
7. `src/lib/components/event-planning/EventDetailsSection.svelte` - Section component
8. `src/lib/components/event-planning/FinancialTermsSection.svelte` - Section component
9. `src/lib/components/event-planning/TimelineSection.svelte` - Section component
10. `src/lib/components/event-planning/LegalTermsSection.svelte` - Section component
11. `src/routes/contracts/event-planning/+page.svelte` - Route page

**Files to modify (4):**
1. `src/lib/utils/ContractRepository.ts` - Add event-planning type support
2. `src/lib/utils/contracts.ts` - Add wrapper function
3. `src/routes/contracts/+page.svelte` - Add contract type card
4. `src/lib/components/ContractList.svelte` - Handle both contract types

---

## Notes & Considerations

**Bilingual approach:**
Auto-translation from English to Vietnamese using MyMemory API (same as DJ service contract)

**Form complexity:**
- Accordion/collapsible sections to reduce cognitive load
- Field dependency logic (e.g., deposit % auto-calculates final payment %)

**Validation priority:**
Thorough Zod validation essential for Firebase safety

**Template compatibility:**
Verify `static/event-planning-services-template.docx` matches placeholder list
