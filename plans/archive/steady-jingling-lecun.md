# Plan: Remove shadcn-svelte, Build Custom Component Library on bits-ui

## Context

The project uses shadcn-svelte (a styled component layer on top of bits-ui), but adoption is wildly inconsistent. Out of 12 shadcn component sets, only Button (34 files) and Badge (12 files) are well-adopted. The rest are barely used or never used. Meanwhile, the codebase has massive duplication: ~121 occurrences of hardcoded input styling (`border-gray-300`, `focus:ring-blue-500/10`) across 21 files, using raw HTML elements instead of any component.

**Goal:** Remove the shadcn abstraction layer, keep bits-ui as headless primitives, build our own lean component library that uses design system tokens consistently, and eliminate all duplication.

**Decisions made:**

- Separate components (TextField, TextareaField, SelectField) — not a unified FormField
- Replace ALL native `<button>` elements with the Button component
- Create a `FormSection` wrapper component for the repeated section container pattern

---

## Phase 0: Delete Dead Code √

**Delete files:**

- `components.json` (shadcn registry config — no longer needed)
- `src/lib/components/ui/textarea/` directory (0 consumers — never imported)
- `src/lib/components/ui/separator/` directory (0 external consumers)

**Fix:** Update `src/lib/components/ui/select/select-separator.svelte` to import bits-ui Separator directly instead of from the deleted UI wrapper.

**Verify:** `pnpm check` → 0 errors, 0 warnings

---

## Phase 1: Create & Update Core Form Components √

### 1a. Update `TextField.svelte` — replace hardcoded colors with design tokens

**File:** `src/lib/components/TextField.svelte`

| Before                   | After                       |
| ------------------------ | --------------------------- |
| `text-gray-700`          | `text-foreground`           |
| `border-gray-300`        | `border-input`              |
| `focus:ring-blue-500/10` | `focus:ring-ring`           |
| `focus:border-blue-500`  | `focus:border-ring`         |
| `text-red-500`           | `text-destructive`          |
| `border-red-500`         | `border-destructive`        |
| `focus:ring-red-500/10`  | `focus:ring-destructive/10` |

### 1b. Update `TextareaField.svelte` — normalize styling + design tokens

**File:** `src/lib/components/TextareaField.svelte`

Same token replacements as TextField. Also normalize the inconsistent styling:

- `rounded-2xl` → `rounded-md` (match TextField)
- `border-none` → `border border-input` (match TextField)
- `px-4 py-3` → `px-3.5 py-2.5` (match TextField)
- `focus:ring-4 focus:ring-primary/10` → `focus:ring-2 focus:ring-ring` (match TextField)

### 1c. Create `SelectField.svelte` — new component for native select dropdowns

**New file:** `src/lib/components/SelectField.svelte`

Same API pattern as TextField: `id`, `label`, `value` (bindable), `required`, `error`, `helperText`, `class`, plus a `children` snippet for `<option>` elements. Same design-token-based styling.

### 1d. Create `FormSection.svelte` — section container component

**New file:** `src/lib/components/FormSection.svelte`

Encapsulates the repeated `bg-card p-6 rounded-lg border border-border` + `<h3>` pattern. Props: `title` (string), `children` (snippet), optional `class`.

### 1e. Update `BankNameCombobox.svelte` — design tokens

**File:** `src/lib/components/v2/forms/BankNameCombobox.svelte`

Same hardcoded color → design token replacements.

**Verify:** `pnpm check` → 0 errors, 0 warnings

---

## Phase 2: Migrate Form Sections (Bulk — 6 groups) √

Replace all ordinary raw `<input>`, `<label>`, `<select>`, `<textarea>` with TextField/TextareaField/SelectField. Replace section containers with FormSection. Specialized native controls remain where they are required for behavior: the hidden file picker, the bank combobox search input, and the rental terms checkbox.

Each group is committed independently for safe rollback.

### Group A — Service Provision contracts

- `src/lib/components/v2/contracts/sections/ContractBasicsSection.svelte`
- `src/lib/components/v2/contracts/sections/ServiceDetailsSection.svelte`
- `src/lib/components/v2/contracts/ServiceProvisionForm.svelte`
- Any other service provision section files

### Group B — Event Planning contracts

- `src/lib/components/v2/contracts/EventPlanningForm.svelte`
- `src/lib/components/v2/contracts/sections/EventPlanningClientSection.svelte`
- `src/lib/components/v2/contracts/sections/EventPlanningEventInfoSection.svelte`
- `src/lib/components/v2/contracts/sections/EventPlanningFinancialSection.svelte`
- `src/lib/components/v2/contracts/sections/EventPlanningTimelineSection.svelte`
- `src/lib/components/v2/contracts/sections/EventPlanningLegalSection.svelte`
- `src/lib/components/v2/contracts/sections/EventPlanningContractBasicsSection.svelte`

### Group C — Equipment Rental contracts

- `src/lib/components/v2/contracts/EquipmentRentalForm.svelte`
- `src/lib/components/v2/contracts/EquipmentRentalOneOffForm.svelte`
- `src/lib/components/v2/contracts/sections/EquipmentRentalContractBasicsSection.svelte`
- `src/lib/components/v2/contracts/sections/EquipmentRentalListSection.svelte`
- `src/lib/components/v2/contracts/sections/EquipmentRentalTermsSection.svelte`

### Group D — DJ Residency contracts

- `src/lib/components/v2/contracts/DjResidencyForm.svelte`
- `src/lib/components/v2/contracts/sections/PerformanceForm.svelte`
- `src/lib/components/v2/contracts/sections/PerformanceItem.svelte`

### Group E — Counterparty forms

- `src/lib/components/v2/counterparties/ClientForm.svelte`
- `src/lib/components/v2/counterparties/ServiceProviderForm.svelte`
- `src/lib/components/v2/counterparties/PerformerForm.svelte`

### Group F — Other forms & inline creators

- `src/lib/components/v2/events/EventForm.svelte`
- `src/lib/components/v2/contracts/sections/CreateEventInline.svelte`
- `src/lib/components/v2/contracts/sections/CreatePerformerInline.svelte`
- `src/lib/components/v2/contracts/sections/CreateCounterpartyInline.svelte`
- `src/routes/payments/+page.svelte`

**After each group:** `pnpm check` → 0 errors, 0 warnings

---

## Phase 3: Replace All Native `<button>` with Button Component √

Replace ~25 files of raw `<button>` elements with the `Button` component.

**Mapping native patterns → Button variants:**

| Native Pattern                              | Button variant + size                           |
| ------------------------------------------- | ----------------------------------------------- |
| `bg-blue-600 text-white hover:bg-blue-700`  | `variant="default"`                             |
| `border border-gray-300 hover:bg-gray-50`   | `variant="outline"`                             |
| `text-blue-600 hover:text-blue-700 text-sm` | `variant="link"` or `variant="ghost"`           |
| `text-red-600 hover:text-red-700 text-sm`   | `variant="destructive"` + `size="sm"`           |
| Icon-only buttons (sidebar, theme toggle)   | `variant="ghost"` + `size="icon"`               |
| Card selector buttons                       | `variant="outline"` with custom class overrides |

**Key files:**

- `src/lib/components/Sidebar.svelte`
- `src/lib/components/Header.svelte`
- `src/lib/components/AppShell.svelte`
- `src/lib/components/LoginForm.svelte`
- `src/lib/components/v2/contracts/ContractTypeSelector.svelte`
- All inline creator components (CreatePerformerInline, etc.)
- `src/routes/payments/+page.svelte`
- `src/routes/counterparties/new/contractor/+page.svelte`

**Verify:** `pnpm check` → 0 errors, 0 warnings

---

## Phase 4: Clean Up LoginForm + Delete Remaining Unused shadcn Components √

1. **Rewrite `LoginForm.svelte`** to use TextField instead of shadcn Input + Label
2. **Update `FileUpload.svelte`** — replace Label import with plain `<label>` element
3. **Delete** `src/lib/components/ui/input/` directory
4. **Delete** `src/lib/components/ui/label/` directory

**Verify:** `pnpm check` → 0 errors, 0 warnings

---

## Phase 5: Simplify Avatar Component √

Current: 3 files (avatar.svelte, avatar-image.svelte, avatar-fallback.svelte)
Usage: 2 files (Header.svelte, AppShell.svelte) — neither uses Avatar.Image

Consolidate into a single `avatar.svelte` that wraps bits-ui Avatar.Root + Avatar.Fallback directly. Delete avatar-image.svelte and the unused avatar-fallback.svelte wrapper. Header.svelte and AppShell.svelte already import the consolidated component directly.

---

## Phase 6: Migrate Remaining Hardcoded Colors √

Search-and-replace remaining generic hardcoded colors across non-form files:

- `bg-white` → `bg-card` or `bg-background`
- `text-gray-900` → `text-foreground`
- `text-gray-700` → `text-foreground`
- `text-gray-500` → `text-muted-foreground`
- `text-gray-400` → `text-muted-foreground`
- `border-gray-200` → `border-border`
- `border-gray-300` → `border-border`
- `hover:bg-gray-50` → `hover:bg-accent`
- `hover:bg-gray-100` → `hover:bg-accent`
- `bg-blue-50` → contextual (use `bg-primary/5` or `bg-accent`)
- `text-blue-600` → `text-primary`
- `bg-blue-600` → `bg-primary`

**Scope:** All remaining .svelte files in src/lib/components/ and src/routes/. Generic UI neutrals are now tokenized. Status, financial, warning, category, and contract print-preview colors remain explicit because they communicate state or must retain fixed print output.

---

## Phase 7: Final Verification

1. `pnpm check` → 0 errors, 0 warnings √
2. `pnpm build` → successful production build √
3. Visual spot-check of key pages (manual follow-up):
   - Login page
   - Contracts list
   - Each contract form (service, event planning, equipment rental, DJ residency)
   - Counterparties list + forms
   - Events list + form
   - Payments page
4. Verify dark mode still works on all pages (manual follow-up)
5. Clean up `src/lib/utils.ts` — audited; the remaining type helpers are still used by bits-ui wrappers, so none should be removed

---

## What We Keep

| Package                   | Reason                                                           |
| ------------------------- | ---------------------------------------------------------------- |
| `bits-ui`                 | Headless primitives for Select, DropdownMenu, Avatar             |
| `clsx` + `tailwind-merge` | `cn()` utility used by all remaining UI components               |
| `tailwind-variants`       | Variant management for Button (8 variants), Badge (4), Alert (2) |
| `svelte-sonner`           | Toast notifications                                              |

## What We Delete

| Item              | Reason                                             |
| ----------------- | -------------------------------------------------- |
| `components.json` | shadcn registry config — not needed                |
| `ui/textarea/`    | Never used (0 imports)                             |
| `ui/separator/`   | No external consumers                              |
| `ui/input/`       | Replaced by TextField                              |
| `ui/label/`       | Replaced by inline labels in TextField/SelectField |

## Final Component Library Structure

```
src/lib/components/
├── ui/                          # Styled components (kept from shadcn, now "ours")
│   ├── alert/                   # Alert + variants (tailwind-variants)
│   ├── avatar/                  # Simplified single-file (bits-ui)
│   ├── badge/                   # Badge + variants (tailwind-variants)
│   ├── button/                  # Button + variants (tailwind-variants)
│   ├── card/                    # Card layout containers
│   ├── dropdown-menu/           # DropdownMenu (bits-ui)
│   ├── select/                  # Styled bits-ui Select (for complex use cases)
│   └── sonner/                  # Toast wrapper (svelte-sonner)
├── TextField.svelte             # Label + input + error (design tokens)
├── TextareaField.svelte         # Label + textarea + error (design tokens)
├── SelectField.svelte           # Label + native select + error (design tokens) [NEW]
├── FormSection.svelte           # Section container with title [NEW]
├── FileUpload.svelte
├── BankNameCombobox.svelte      # (in v2/forms/)
└── ...other custom components
```
