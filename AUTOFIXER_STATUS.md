# Svelte Autofixer Status Tracker

This document tracks which Svelte components have been validated with the Svelte autofixer tool.

**Last Updated:** 2026-01-03

## ⚠️ Important Note

**We ONLY check custom components and routes - NOT ui/ folder components!**

Components in `src/lib/components/ui/` are from shadcn/ui (third-party library) and should **NOT** be checked with autofixer unless specific issues arise. They are maintained by the shadcn/ui project and follow their own conventions.

## Status Legend
- ✅ **Checked** - Component passed autofixer with 0 issues
- ⚠️ **Needs Review** - Component has autofixer suggestions that need to be addressed
- ❌ **Not Checked** - Component hasn't been validated yet
- 🔄 **In Progress** - Currently being reviewed/fixed

---

## Custom Components

### Core Components (`src/lib/components/`)

| Component | Status | Last Checked | Notes |
|-----------|--------|--------------|-------|
| AuthGuard.svelte | ✅ | 2026-01-02 | Clean - no issues |
| ClientForm.svelte | ✅ | 2026-01-02 | Recent refactor, no $effect issues |
| ContractPageHeader.svelte | ✅ | 2026-01-02 | Fixed deprecated slot usage |
| DashboardCard.svelte | ❌ | - | - |
| ContractValue.svelte | ❌ | - | - |
| EventPlanningContractForm.svelte | ✅ | 2026-01-02 | Clean - orchestrator pattern |
| FileUpload.svelte | ✅ | 2026-01-02 | Updated to use bind:this |
| Header.svelte | ✅ | 2026-01-02 | Clean - no issues |
| LatestContractsList.svelte | ✅ | 2026-01-03 | Subscription pattern - see Known Issues |
| ContractListItem.svelte | ✅ | 2026-01-03 | Renamed from LatestContractsListItem, generic component for all contract lists |
| LocationForm.svelte | ❌ | - | - |
| LoginForm.svelte | ❌ | - | - |
| ServiceContractForm.svelte | ✅ | 2026-01-02 | Recent refactor, no $effect issues |
| ServiceContractList.svelte | ✅ | 2026-01-02 | Clean - no issues |
| ServiceContractListItem.svelte | ✅ | 2026-01-03 | Dashboard grid layout, Titillium Web typography |
| TextField.svelte | ✅ | 2026-01-02 | Updated to handle nullable values |
| TextareaField.svelte | ✅ | 2026-01-02 | Updated to handle nullable values |

### Event Planning Components (`src/lib/components/event-planning/`)

| Component | Status | Last Checked | Notes |
|-----------|--------|--------------|-------|
| ClientInfoSection.svelte | ✅ | 2026-01-02 | Removed unnecessary fields |
| ContractInfoSection.svelte | ❌ | - | - |
| EventDetailsSection.svelte | ❌ | - | - |
| FinancialTermsSection.svelte | ❌ | - | - |
| LegalTermsSection.svelte | ❌ | - | - |
| TimelineSection.svelte | ❌ | - | - |

### Route Components (`src/routes/`)

| Component | Status | Last Checked | Notes |
|-----------|--------|--------------|-------|
| +layout.svelte | ❌ | - | - |
| +page.svelte (root) | ❌ | - | - |
| contacts/+page.svelte | ❌ | - | - |
| contracts/+page.svelte | ❌ | - | - |
| contracts/event-planning/+page.svelte | ❌ | - | - |
| contracts/event-planning/list/+page.svelte | ✅ | 2026-01-03 | Refactored to use generic ContractListItem |
| contracts/service/+page.svelte | ❌ | - | - |
| contracts/service/list/+page.svelte | ❌ | - | - |
| design-system/+layout.svelte | ✅ | 2026-01-02 | Clean - no issues |
| design-system/+page.svelte | ✅ | 2026-01-02 | Fixed missing keys in each blocks |
| login/+page.svelte | ❌ | - | - |

---

## Autofixer Check Process

When checking a component:

1. **Run the autofixer:**
   ```bash
   # Use the Svelte MCP autofixer tool via Claude Code
   ```

2. **Review suggestions:**
   - Address ALL suggestions (per CLAUDE.md guidelines)
   - Update the component code
   - Re-run autofixer to verify

3. **Update this document:**
   - Change status to ✅
   - Add current date
   - Add any relevant notes

4. **Run TypeScript checks:**
   ```bash
   pnpm check
   ```
   - Must show "0 errors and 0 warnings"

---

## Known Issues (To Revisit)

### Subscription Pattern Warnings

**Components Affected:**
- LatestContractsList.svelte
- +page.svelte (Dashboard root)

**Issue:**
Autofixer gives 2 suggestions about calling `.init()` and `.destroy()` methods inside `$effect`:
```
"You are calling a function inside an $effect. Please check if the function
is reassigning a stateful variable because that's considered malpractice..."
```

**Context:**
- This is the established pattern for managing Firestore subscriptions via state classes
- Same pattern used in `ContractState` and `ServiceContractState`
- The autofixer suggests to ignore if we're sure the functions are managing side effects
- This is legitimate use of `$effect` for external API subscriptions (Firestore)

**Decision:**
- Accepted as valid pattern for now
- Consider refactoring subscription management pattern in future to eliminate warnings
- Not blocking since autofixer says to ignore if certain about side effects

**Date Noted:** 2026-01-03

---

## Common Issues to Watch For

Based on CLAUDE.md guidelines:

- ❌ **Never use `$effect` to sync props to state** - Use `$derived` or direct prop access
- ✅ **Use runes-based patterns** - Svelte 5 modern approach
- ✅ **Small, focused components** - Each component does one thing well
- ✅ **Externalized logic** - Business logic in utility functions
- ✅ **Tailwind-first styling** - No `<style>` blocks unless absolutely necessary
- ✅ **Type safety** - Full TypeScript typing, no `any` types

---

## Progress Tracking

**Total Custom Components:** 34 (ui/ folder NOT included - shadcn components)
**Checked:** 17 (50%)
**Needs Review:** 0 (0%)
**Not Checked:** 17 (50%)

**Recently Checked (2026-01-03):**
- LatestContractsList.svelte ✅
- ContractListItem.svelte ✅ (renamed from LatestContractsListItem)
- ServiceContractListItem.svelte ✅
- contracts/event-planning/list/+page.svelte ✅ (refactored to use generic component)

**Previously Checked (2026-01-02):**
- AuthGuard.svelte ✅
- ClientForm.svelte ✅
- ContractPageHeader.svelte ✅
- design-system/+layout.svelte ✅
- design-system/+page.svelte ✅
- contracts/event-planning/list/+page.svelte ✅
- EventPlanningContractForm.svelte ✅
- FileUpload.svelte ✅
- Header.svelte ✅
- ServiceContractForm.svelte ✅
- ServiceContractList.svelte ✅
- TextField.svelte ✅
- TextareaField.svelte ✅
- event-planning/ClientInfoSection.svelte ✅

**Goal:** 100% of custom components checked and validated
