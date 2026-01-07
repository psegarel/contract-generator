# Contract HTML Preview Feature - Implementation Plan

## Overview
Add HTML preview pages for contracts that display the contract document as it would appear in the downloaded Word document. This allows users to review contracts before downloading and ensures the "View" button shows a preview rather than the edit form.

**Current State:**
- `/contracts/{type}/[id]/+page.svelte` → Shows edit form
- "View" button → Incorrectly navigates to edit form
- No preview of the actual contract document

**Target State:**
- `/contracts/{type}/[id]/+page.svelte` → Shows HTML preview of contract (read-only)
- `/contracts/{type}/[id]/edit/+page.svelte` → Shows edit form
- "View" button → Navigates to preview page
- "Edit" button → Navigates to edit form (new button in list items)

## Architecture Principles 🏗️

**Component Design:**
- ✅ **Small components** - Each component should do one thing well
- ✅ **Reusable utilities** - Extract shared data transformation logic
- ✅ **Template mirroring** - HTML templates should mirror Word document structure
- ✅ **Data consistency** - Use same calculations/formatting as document generators

**Key Principles:**
- HTML templates should visually match the Word document layout
- Reuse data transformation logic from generators (calculations, formatting, translations)
- Keep view components read-only (no editing capabilities)
- Separate view and edit routes clearly

## Implementation Phases

### Phase 1: Extract Shared Data Transformation Utilities ⭐ START HERE

**Objective:** Extract reusable data transformation logic from generators into shared utilities that can be used by both document generation and HTML preview.

**Files to create:**
- `src/lib/utils/v2/contractDataTransformers.ts`

**Tasks:**
1. Extract contract number generation logic (date + initials + timestamp)
2. Extract currency formatting function (Vietnamese locale)
3. Extract date formatting functions (Vietnamese and English formats)
4. Extract calculation logic (gross fee, tax amount for service contracts)
5. Extract translation utilities (Vietnamese translation wrapper)
6. Create transformer functions for each contract type:
   - `transformServiceProvisionContractData(contract)` → returns formatted data object
   - `transformEventPlanningContractData(contract)` → returns formatted data object

**Data Structure:**
Each transformer should return an object with all the same fields that the document generator uses, ensuring consistency between Word document and HTML preview.

**Example structure:**
```typescript
export interface ServiceProvisionContractViewData {
  contractNumber: string;
  companyName: string;
  companyAddressLine1: string;
  // ... all company fields
  clientName: string;
  clientEmail: string;
  // ... all client fields
  jobName: string;
  jobNameVN: string;
  // ... all formatted fields
  netFee: string; // formatted currency
  taxRate: number;
  taxAmount: string; // formatted currency
  grossFee: string; // formatted currency
  // ... etc
}
```

**Deliverable:** Shared utilities that both generators and HTML previews can use.

---

### Phase 2: Create HTML Template Components

**Objective:** Create HTML components that mirror the Word document structure for each contract type.

**Files to create:**
- `src/lib/components/v2/contracts/preview/ServiceProvisionContractPreview.svelte`
- `src/lib/components/v2/contracts/preview/EventPlanningContractPreview.svelte`

**Tasks:**
1. **Service Provision Contract Preview:**
   - Create component that accepts `ServiceProvisionContractViewData`
   - Structure should mirror Word document:
     - Header with contract number
     - Company information section (Party A)
     - Client information section (Party B)
     - Event details section
     - Financial terms section
     - Contract period section
     - Signature section (read-only, styled)
   - Use Tailwind classes for styling to match document appearance
   - Ensure proper typography, spacing, and layout

2. **Event Planning Contract Preview:**
   - Create component that accepts `EventPlanningContractViewData`
   - Structure should mirror Word document:
     - Header with contract number and dates
     - Contract location
     - Client information (Party A) - bilingual
     - Event information section - bilingual
     - Financial terms section
     - Timeline section
     - Legal terms section
     - Signature section (read-only, styled)
   - Handle bilingual display (English/Vietnamese side-by-side or stacked)

**Styling Guidelines:**
- Use print-friendly styling (consider `@media print` styles)
- Match document margins and spacing
- Use appropriate typography (serif fonts for formal documents)
- Ensure proper line breaks and paragraph spacing
- Style tables if present in Word document
- Add subtle borders/sections to match document structure

**Deliverable:** HTML preview components that visually match the Word documents.

---

### Phase 3: Create View Page Routes

**Objective:** Create view pages that display the HTML preview of contracts.

**Files to create:**
- `src/routes/contracts/service-provision/[id]/+page.svelte` (replace existing)
- `src/routes/contracts/event-planning/[id]/+page.svelte` (replace existing)

**Files to move/create:**
- `src/routes/contracts/service-provision/[id]/edit/+page.svelte` (move from `[id]/+page.svelte`)
- `src/routes/contracts/service-provision/[id]/edit/+page.ts` (move from `[id]/+page.ts`)
- `src/routes/contracts/event-planning/[id]/edit/+page.svelte` (move from `[id]/+page.svelte`)
- `src/routes/contracts/event-planning/[id]/edit/+page.ts` (move from `[id]/+page.ts`)

**Tasks:**
1. **Update load functions:**
   - Keep existing load functions in `[id]/+page.ts` (they already load contract data)
   - Create new load functions in `[id]/edit/+page.ts` (copy from existing)

2. **Create view pages:**
   - Load contract data using existing load functions
   - Transform contract data using transformer utilities
   - Render appropriate preview component based on contract type
   - Add header with contract number and actions (Edit, Download, Back)
   - Add print-friendly styling

3. **Page structure:**
   ```svelte
   <div class="container mx-auto px-4 py-8 max-w-4xl">
     <!-- Header with actions -->
     <div class="mb-6 flex items-center justify-between">
       <h1>Contract #{contract.contractNumber}</h1>
       <div class="flex gap-2">
         <Button href={`/contracts/${contract.type}/${contract.id}/edit`}>Edit</Button>
         <Button onclick={handleDownload}>Download</Button>
       </div>
     </div>
     
     <!-- Preview component -->
     <ServiceProvisionContractPreview data={transformedData} />
   </div>
   ```

**Deliverable:** View pages that display HTML previews of contracts.

---

### Phase 4: Update Contract List Components

**Objective:** Add "Edit" button to contract list items and ensure "View" button navigates correctly.

**Files to modify:**
- `src/lib/components/v2/contracts/ContractListItem.svelte`
- `src/lib/components/v2/contracts/ContractCard.svelte`

**Tasks:**
1. **Add Edit button:**
   - Import `Edit` icon from lucide-svelte
   - Add Edit button next to View button
   - Edit button should link to `/contracts/{type}/{id}/edit`
   - Use variant="outline" or variant="secondary" for Edit button
   - Use variant="success" for View button (keep existing)

2. **Update button layout:**
   - Desktop grid: Add Edit button in actions column
   - Mobile/Tablet cards: Add Edit button in actions row
   - Ensure proper spacing and alignment

3. **Update getDefaultContractLink:**
   - Keep existing function (already points to `/contracts/{type}/{id}`)
   - This will now correctly point to view page

**Button order (left to right):**
- View (success variant) → Preview page
- Edit (outline/secondary variant) → Edit form
- Download (outline variant) → Download document
- Delete (destructive variant) → Delete contract

**Deliverable:** Contract list items with both View and Edit buttons.

---

### Phase 5: Handle Async Data Transformation

**Objective:** Handle async operations (translations) in view pages.

**Challenge:** Contract generators use async translation functions. View pages need to handle this.

**Solution Options:**
1. **Load function approach:** Perform translations in load function (server-side or client-side)
2. **Component approach:** Use `onMount` to load translations and show loading state
3. **Cached translations:** Store translations in contract data (future optimization)

**Recommended Approach:** Use load function to transform data
- Create transformer functions that can be called in load functions
- Handle async translations in load function
- Pass fully transformed data to component
- Show loading state while translations are being fetched

**Files to modify:**
- `src/routes/contracts/service-provision/[id]/+page.ts`
- `src/routes/contracts/event-planning/[id]/+page.ts`

**Tasks:**
1. Import transformer utilities
2. Call transformer function with contract data
3. Return transformed data along with original contract
4. Handle errors gracefully (fallback to non-translated data)

**Deliverable:** View pages that handle async data transformation properly.

---

### Phase 6: Styling & Polish

**Objective:** Ensure HTML previews match Word document appearance and are print-friendly.

**Tasks:**
1. **Typography:**
   - Use serif font for document body (Times New Roman or similar)
   - Match font sizes to document
   - Ensure proper line height and spacing

2. **Layout:**
   - Match margins (typically 1 inch / 2.54cm)
   - Ensure proper section spacing
   - Align text appropriately (left, center, right as needed)

3. **Print styles:**
   - Add `@media print` styles
   - Hide navigation/actions when printing
   - Ensure proper page breaks
   - Match document page size (A4)

4. **Responsive design:**
   - Ensure preview is readable on all screen sizes
   - Consider mobile view (may need horizontal scroll or adjusted layout)

5. **Visual consistency:**
   - Match document colors (typically black text on white)
   - Add subtle borders/sections if present in Word document
   - Style tables if present

**Files to modify:**
- Preview components
- Add print styles to `src/app.css` or component styles

**Deliverable:** Polished HTML previews that closely match Word documents.

---

### Phase 7: Testing & Validation

**Objective:** Ensure feature works correctly and matches requirements.

**Testing Checklist:**
1. ✅ View button navigates to preview page (not edit form)
2. ✅ Edit button navigates to edit form
3. ✅ Preview displays all contract data correctly
4. ✅ Preview matches Word document structure
5. ✅ Translations work correctly (Vietnamese fields)
6. ✅ Currency formatting is correct
7. ✅ Date formatting is correct
8. ✅ Calculations are correct (gross fee, tax amount)
9. ✅ Print styles work correctly
10. ✅ Mobile/tablet/desktop views work
11. ✅ Download button still works from preview page
12. ✅ Edit form still works after route change
13. ✅ TypeScript types are correct (no errors)
14. ✅ Svelte autofixer passes (no suggestions)

**Files to test:**
- Service provision contract view
- Event planning contract view
- Contract list items (View/Edit buttons)
- Contract cards (mobile/tablet)

**Deliverable:** Fully tested and validated feature.

---

## Implementation Order (Step-by-Step)

**IMPORTANT**: Implement and test each phase before moving to the next.

### Step 1: Extract Shared Utilities ⭐ START HERE
- Create `src/lib/utils/v2/contractDataTransformers.ts`
- Extract all transformation logic from generators
- Test utilities independently
- **Deliverable**: Working transformer utilities

### Step 2: Create HTML Preview Components
- Create `ServiceProvisionContractPreview.svelte`
- Create `EventPlanningContractPreview.svelte`
- Style to match Word documents
- **Deliverable**: HTML preview components

### Step 3: Create View Pages
- Move edit forms to `/edit` subroutes
- Create view pages at `/[id]/+page.svelte`
- Integrate preview components
- **Deliverable**: Working view pages

### Step 4: Update Contract List Components
- Add Edit button to `ContractListItem.svelte`
- Add Edit button to `ContractCard.svelte`
- Test navigation
- **Deliverable**: Updated list components with View/Edit buttons

### Step 5: Handle Async Operations
- Update load functions to handle translations
- Add loading states
- **Deliverable**: Async data transformation working

### Step 6: Styling & Polish
- Refine preview styling
- Add print styles
- Test on different screen sizes
- **Deliverable**: Polished previews

### Step 7: Testing & Validation
- Comprehensive testing
- Run `pnpm check` (0 errors, 0 warnings)
- Run Svelte autofixer
- **Deliverable**: Production-ready feature

---

## Critical Files Summary

**New files to create (4):**
1. `src/lib/utils/v2/contractDataTransformers.ts` - Shared transformation utilities
2. `src/lib/components/v2/contracts/preview/ServiceProvisionContractPreview.svelte` - Service contract preview
3. `src/lib/components/v2/contracts/preview/EventPlanningContractPreview.svelte` - Event planning preview
4. `docs/contract-html-preview-implementation.md` - This plan document

**Files to move (4):**
1. `src/routes/contracts/service-provision/[id]/+page.svelte` → `[id]/edit/+page.svelte`
2. `src/routes/contracts/service-provision/[id]/+page.ts` → `[id]/edit/+page.ts`
3. `src/routes/contracts/event-planning/[id]/+page.svelte` → `[id]/edit/+page.svelte`
4. `src/routes/contracts/event-planning/[id]/+page.ts` → `[id]/edit/+page.ts`

**Files to create (view pages) (2):**
1. `src/routes/contracts/service-provision/[id]/+page.svelte` - New view page
2. `src/routes/contracts/event-planning/[id]/+page.svelte` - New view page

**Files to modify (4):**
1. `src/lib/components/v2/contracts/ContractListItem.svelte` - Add Edit button
2. `src/lib/components/v2/contracts/ContractCard.svelte` - Add Edit button
3. `src/routes/contracts/service-provision/[id]/+page.ts` - Update load function
4. `src/routes/contracts/event-planning/[id]/+page.ts` - Update load function

---

## Notes & Considerations

**Data Transformation:**
- Must match generator logic exactly (calculations, formatting, translations)
- Consider caching translations to avoid repeated API calls
- Handle errors gracefully (fallback to non-translated data)

**Styling Approach:**
- Use Tailwind utilities primarily
- May need some custom CSS for print styles
- Consider using a serif font for document body
- Match Word document margins and spacing

**Performance:**
- Translations are async - consider loading states
- Large contracts may need pagination or virtual scrolling
- Consider lazy loading preview components

**Accessibility:**
- Ensure proper heading hierarchy
- Add ARIA labels where needed
- Ensure keyboard navigation works
- Test with screen readers

**Future Enhancements:**
- PDF export from HTML preview
- Side-by-side comparison (Word vs HTML)
- Version history preview
- Print optimization improvements

---

## Status Tracking

### Session 1 - 2026-01-08
**Status:** Planning phase
- ✅ Created feature branch: `feature/contract-html-preview`
- ✅ Created implementation plan document
- ⏳ Next: Begin Phase 1 - Extract shared utilities

**Current Phase:** Phase 1 - Extract Shared Data Transformation Utilities
**Progress:** 0% - Not started

**Blockers:** None

**Notes:**
- Plan document created and ready for implementation
- Need to review existing generator code to identify all transformation logic
- Will need to handle async translations in load functions

---

**Last Updated:** 2026-01-08
**Current Branch:** `feature/contract-html-preview`
**Next Steps:** Begin Phase 1 - Extract shared data transformation utilities

