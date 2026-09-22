# Architecture Refactor Plan: Separate Contract Types

**Date**: 2026-01-01
**Status**: ✅ **COMPLETED** (2026-01-02)
**Priority**: High (Technical Debt Prevention)

---

## ✅ Completion Summary

**Completed**: January 2, 2026

All phases of the architecture refactor have been successfully completed:
- ✅ Phase 1: Separate collections & repositories (`service-contracts` collection created)
- ✅ Phase 2: Separate UI components (`ServiceContractList` component)
- ✅ Phase 3: Separate routes (`/contracts/service/list`)
- ✅ Phase 4: Cleanup (removed deprecated code)
- ✅ Data migration completed (all contracts migrated to new collection)
- ✅ 0 TypeScript errors, 0 warnings

**Additional improvements:**
- Renamed `stores` → `state` for Svelte 5 clarity
- Renamed `AuthStore` → `AuthState`, `ThemeStore` → `ThemeState`
- Fixed all Svelte 5 `state_referenced_locally` warnings

---

## Executive Summary

Refactor the contract system to treat each contract type as completely independent, using separate Firestore collections, separate repository functions, and separate UI components. This prevents scaling issues and allows each contract type to evolve independently.

---

## Current Architecture Problems

### 1. Single Firestore Collection with Discriminated Union
```
Firestore: "contracts" collection
  ├── { type: 'service', contractData: {...} }
  ├── { type: 'event-planning', contractData: {...} }
  └── { type: 'service', contractData: {...} }
```

**Issues:**
- ❌ Queries fetch ALL contract types, then filter in memory (inefficient)
- ❌ Cannot optimize Firestore indexes per contract type
- ❌ Schema changes risk breaking multiple contract types
- ❌ Locked into early design decisions
- ❌ TypeScript discriminated unions add unnecessary complexity

### 2. Shared UI Components (ContractList.svelte)
```typescript
// Branches on contract type throughout the component
if (contract.type === 'service') {
  return contract.contractData.clientName;
} else {
  return contract.contractData.clientCompany;
}
```

**Issues:**
- ❌ Doesn't scale (3-4 contract types = unmaintainable switch statements)
- ❌ Tight coupling between unrelated features
- ❌ Violates Single Responsibility Principle
- ❌ TypeScript type narrowing issues in Svelte
- ❌ Every contract type change touches shared code

---

## Proposed Architecture: Complete Separation

### Principle: "Apples and Oranges"

Different contract types are fundamentally different domain objects. They should share **nothing** except reusable UI primitives (TextField, TextareaField, etc.).

### 1. Separate Firestore Collections

```
Firestore:
  ├── "service-contracts"
  │   └── { contractNumber, contractData: ContractData, createdAt, ... }
  │
  ├── "event-planning-contracts"
  │   └── { contractNumber, contractData: EventPlanningContractData, createdAt, ... }
  │
  └── (future) "dj-residency-contracts"
      └── { contractNumber, contractData: DJResidencyContractData, createdAt, ... }
```

**Benefits:**
- ✅ Efficient queries (fetch only what you need)
- ✅ Type-specific Firestore indexes
- ✅ Independent schema evolution
- ✅ Different security rules per type if needed
- ✅ No discriminated union complexity

### 2. Separate Repository Functions

```
src/lib/utils/
  ├── serviceContracts.ts
  │   ├── saveServiceContract()
  │   ├── getServiceContracts()
  │   ├── getServiceContractById()
  │   └── updateServiceContract()
  │
  └── eventPlanningContracts.ts
      ├── saveEventPlanningContract()
      ├── getEventPlanningContracts()
      ├── getEventPlanningContractById()
      └── updateEventPlanningContract()
```

**No shared abstractions. Each contract type is independent.**

### 3. Separate UI Components

```
src/lib/components/
  ├── ServiceContractList.svelte       # Only displays service contracts
  ├── EventPlanningContractList.svelte # Only displays event planning contracts
  │
  ├── TextField.svelte                 # Shared UI primitive ✅
  └── TextareaField.svelte             # Shared UI primitive ✅
```

### 4. Separate Route Pages

```
src/routes/contracts/
  ├── +page.svelte                     # Contract type selector (unchanged)
  │
  ├── service-contract/
  │   └── +page.svelte                 # Create service contract (exists)
  │
  ├── service/
  │   └── history/
  │       ├── +page.ts                 # Load service contracts only
  │       └── +page.svelte             # ServiceContractList
  │
  ├── event-planning/
  │   └── +page.svelte                 # Create event planning contract (exists)
  │
  └── event-planning/
      └── history/
          ├── +page.ts                 # Load event planning contracts only
          └── +page.svelte             # EventPlanningContractList
```

---

## Migration Plan

### Phase 1: Create Separate Collections & Repositories

**1.1 Create `serviceContracts.ts`**
- Move service contract functions from `ContractRepository.ts`
- Use collection: `"service-contracts"`
- Simple functions, no abstraction

**1.2 Create `eventPlanningContracts.ts`**
- Create event planning contract functions
- Use collection: `"event-planning-contracts"`
- Mirror the service contract API

**1.3 Update existing code to use new functions**
- Update `src/routes/contracts/service-contract/+page.svelte`
- Update `src/routes/contracts/event-planning/+page.svelte`

**1.4 Data migration (if needed)**
- Write script to copy existing contracts to new collections
- Or: keep old data in place, new contracts go to new collections

### Phase 2: Create Separate List Components

**2.1 Create `ServiceContractList.svelte`**
- Copy existing ContractList.svelte
- Remove all event-planning logic
- Optimize for service contract fields only

**2.2 Create `EventPlanningContractList.svelte`**
- Start fresh (don't copy)
- Only display event planning fields
- Optimize for event planning workflow

### Phase 3: Create Separate History Pages

**3.1 Create `/contracts/service/history`**
- `+page.ts`: Load service contracts only
- `+page.svelte`: Use ServiceContractList component

**3.2 Create `/contracts/event-planning/history`**
- `+page.ts`: Load event planning contracts only
- `+page.svelte`: Use EventPlanningContractList component

**3.3 Update navigation**
- Update header/nav to link to separate history pages
- Remove unified `/contracts/history` (or deprecate)

### Phase 4: Cleanup

**4.1 Remove deprecated code**
- `ContractRepository.ts` (if fully replaced)
- `ContractList.svelte` (unified component)
- `/contracts/history` (unified history page)
- `/contracts/[locationId]/list` (location filtering - user doesn't need it)

**4.2 Update documentation**
- Update AI_CONTEXT.md with new architecture
- Update PROGRESS.md
- Update STATUS.md

---

## Benefits of New Architecture

### Scalability
- ✅ Adding a 5th contract type = zero changes to existing code
- ✅ Each contract type can evolve independently
- ✅ No risk of breaking other contract types

### Performance
- ✅ Efficient Firestore queries (fetch only needed data)
- ✅ Type-specific indexes
- ✅ No unnecessary data transfer

### Maintainability
- ✅ No if/else/switch logic based on type
- ✅ Each component has single responsibility
- ✅ Easier to understand and debug
- ✅ Clear separation of concerns

### Developer Experience
- ✅ No TypeScript discriminated union complexity
- ✅ No type narrowing issues
- ✅ Simpler code, easier to reason about

---

## Backward Compatibility

### Option A: Clean Break
- Migrate all existing contracts to new collections
- Remove old code entirely
- **Pros:** Clean architecture, no legacy code
- **Cons:** Data migration required

### Option B: Gradual Migration
- New contracts go to new collections
- Old contracts stay in old collection
- Keep old ContractList for legacy data
- **Pros:** No data migration needed
- **Cons:** Temporary dual systems

**Recommendation:** Option A if data volume is small (< 1000 contracts). Option B if large dataset or production system.

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data loss during migration | High | Test migration script on copy of production data first |
| Breaking existing features | Medium | Comprehensive testing checklist before removing old code |
| Increased code duplication | Low | Acceptable trade-off for independence; share UI primitives only |
| Firestore costs increase | Low | Separate collections don't increase costs; more efficient queries may reduce costs |

---

## Success Criteria

- ✅ Can create service contracts and save to `service-contracts` collection
- ✅ Can create event planning contracts and save to `event-planning-contracts` collection
- ✅ Service contract history shows only service contracts
- ✅ Event planning history shows only event planning contracts
- ✅ Edit/download works for both types
- ✅ No shared logic between contract types (except UI primitives)
- ✅ Zero TypeScript errors
- ✅ Zero autofixer suggestions
- ✅ Adding a new contract type requires zero changes to existing types

---

## Timeline Estimate

- **Phase 1:** 2-3 hours (repositories + migration)
- **Phase 2:** 1-2 hours (list components)
- **Phase 3:** 1 hour (history pages)
- **Phase 4:** 1 hour (cleanup)

**Total:** ~5-7 hours of focused work

---

## Notes

- This refactor prevents technical debt before it becomes painful
- The earlier we do this, the easier it is
- Follows SOLID principles (Single Responsibility, Open/Closed)
- Aligns with domain-driven design (contract types are separate bounded contexts)
