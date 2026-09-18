# Codebase Audit — Remaining Items

**Date:** 2026-07-02
**Previous session:** Deleted 18 dead V1 files, fixed 3 `as any` casts in form components, split DjResidencyPerformanceLog (565 → 192 lines) into sub-components, extracted performance CRUD into utility functions.

---

## 1. Bloated Components (>150 lines)

Target: components under 150 lines (script + template). 26 components currently exceed this.

### Tier 1 — Over 300 lines (high priority)

| Component | Lines | Notes |
|-----------|-------|-------|
| `v2/counterparties/ServiceProviderForm.svelte` | 486 | Large form, candidate for section split |
| `v2/contracts/DjResidencyForm.svelte` | 483 | Large form, candidate for section split |
| `v2/contracts/PerformerForm.svelte` | 368 | Large form |
| `routes/payments/+page.svelte` | 361 | Route page with inline logic |
| `v2/contracts/EquipmentRentalForm.svelte` | 347 | Large form |
| `v2/events/EventForm.svelte` | 325 | Large form |
| `v2/contracts/ServiceProvisionForm.svelte` | 315 | Large form |

### Tier 2 — 200–300 lines (moderate)

| Component | Lines |
|-----------|-------|
| `v2/counterparties/ClientForm.svelte` | 299 |
| `routes/counterparties/[id]/+page.svelte` | 272 |
| `v2/contracts/EventPlanningForm.svelte` | 263 |
| `v2/contracts/ContractListItem.svelte` | 232 |
| `v2/contracts/DjResidencyGenerateContracts.svelte` | 215 |
| `v2/contracts/sections/CreatePerformerInline.svelte` | 210 |
| `routes/contracts/dj-residency/[id]/+page.svelte` | 207 |

### Tier 3 — 150–200 lines (low priority)

ContractCard (159), EquipmentRentalListSection (199), DjResidencyPerformanceLog (191), events/[id]/+page (186), CreateCounterpartyInline (164), Sidebar (162), LoginForm (162), Header (161), EventPlanningFinancialSection (159), AppShell (158), PerformanceForm (157), FileUpload (154), BankNameCombobox (152).

**Recommended approach:** Split Tier 1 forms into section components (same pattern used for DjResidencyPerformanceLog). Extract business logic into utility functions where handlers exceed ~10 lines.

---

## 2. `as any` Type Casts (3 remaining in production code)

All 3 are the same pattern: accessing `ClientCounterparty` fields from a `Counterparty` union type without proper narrowing.

| File | Line | Code |
|------|------|------|
| `utils/equipmentRentalContractGenerator.ts` | 167 | `(counterparty as any)` |
| `utils/v2/contractHtmlGenerator.ts` | 433 | `(counterparty as any).companyName` |
| `utils/v2/contractHtmlGenerator.ts` | 440 | `(counterparty as any)` |

**Fix:** Add a type guard like `isClientCounterparty(c): c is ClientCounterparty` and narrow before accessing client-specific fields.

Note: Additional `as any` casts exist in `scripts/` and `migrations-archive/` — these are one-off scripts, not production code.

---

## 3. Unused Exports

### `src/lib/utils/v2/payments.ts`

| Export | Lines | Type |
|--------|-------|------|
| `syncContractPaymentStatus` | ~25 | Batch payment sync — never called |
| `MigrationResult` | interface | Only used by migration functions below |
| `migratePaymentDueDates` | ~45 | One-off migration, never called |
| `migrateOneTimePaymentDueDates` | ~60 | One-off migration, never called |

**Recommendation:** Delete the 2 migration functions and `MigrationResult` interface (~110 lines). Evaluate whether `syncContractPaymentStatus` is needed or should be deleted.

### `src/lib/config/counterpartyTypes.ts`

| Export | Status |
|--------|--------|
| `SERVICE_TYPES` | Declared but never imported in any component or utility |

**Recommendation:** Delete if not planned for near-term use.

---

## 4. Pre-Built Contract Infrastructure (No UI)

Four contract types have complete backend (schemas, types, CRUD utilities, state files) but **zero routes or form components**:

| Contract Type | Schema | Utility (CRUD) | State File | Route | Form |
|--------------|--------|----------------|------------|-------|------|
| Venue Rental | Yes | 181 lines | Yes | None | None |
| Performer Booking | Yes | 181 lines | Yes | None | None |
| Subcontractor | Yes | 181 lines | Yes | None | None |
| Client Service | Yes | 181 lines | Yes | None | None |

These are wired into the payments module (`syncContractStatusFromPayments` handles all 8 contract types), so they can't be deleted without also updating payments.ts.

**Recommendation:** Either build the UI for these types or remove the entire stack (schema + utility + state + payment references) to avoid dead code. Keeping them adds ~900 lines of untested, unmaintained code.

---

## 5. Documentation Bloat

| File | Lines | Purpose |
|------|-------|---------|
| `AI_CONTEXT.md` | 824 | AI agent context dump |
| `CLAUDE.md` | 619 | Project guidelines (active, checked into repo) |
| `STATUS.md` | 407 | Project status tracker |
| `PROGRESS.md` | 405 | Progress log |
| `AUTOFIXER_STATUS.md` | 235 | Component autofixer tracking |
| `TEMPLATE_PLACEHOLDERS.md` | 75 | Contract template reference |
| `README.md` | 38 | Standard readme |
| `TODOS.md` | 1 | Empty/stub |

**Total: 2,604 lines of markdown**

**Recommendation:** `AI_CONTEXT.md`, `STATUS.md`, and `PROGRESS.md` likely overlap significantly with `CLAUDE.md`. Consider consolidating into `CLAUDE.md` (the canonical agent guide) + `README.md`. Delete `TODOS.md` if empty.

---

## Summary by Priority

### Quick wins (deletions, no risk)
- Delete 2 unused migration functions + `MigrationResult` from payments.ts (~110 lines)
- Delete unused `SERVICE_TYPES` export
- Delete empty `TODOS.md`

### Medium effort (type safety)
- Fix 3 `as any` casts with proper type guards

### Larger effort (architecture)
- Split Tier 1 bloated forms (7 components over 300 lines)
- Decide: build or delete the 4 pre-built contract type stacks
- Consolidate documentation files
