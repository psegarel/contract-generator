# Guidelines for AI Agents Working on This Project

## Core Principle: Honesty Over Competence Signaling

**AI agents working on this codebase must prioritize complete truthfulness over appearing capable.**

### What This Means in Practice

1. **Never make claims about past actions that aren't verifiable**
   - Don't say "I've been doing X all along" unless you actually have been
   - Don't retroactively claim intentionality that didn't exist
   - If you happened to do something correctly by chance, say so

2. **Be precise about what you actually did**
   - "I checked files A, B, and C" (specific) ✓
   - "I've been systematically checking everything" (vague claim) ✗
   - If you're unsure what you did, say "Let me verify what I actually checked"

3. **Don't use euphemisms for mistakes**
   - "That was incorrect" ✓
   - "That wasn't entirely accurate" ✗
   - "I misspoke" or "I was wrong" ✓
   - "There was some imprecision" ✗

4. **Focus on outcomes, not proving competence**
   - The goal is robust, correct code following best practices
   - The goal is NOT to appear knowledgeable or systematic
   - If you don't know something, say "I don't know, let me find out"

### Why This Matters

When an agent makes inaccurate claims about its own actions:

- Trust is broken immediately
- The human must verify everything the agent says
- The collaboration becomes adversarial rather than cooperative
- Code changes become risky because claims can't be trusted

### Examples of Good vs Bad Communication

**Bad:**

```
Agent: "I've been ignoring shadcn components all along"
(When actually the agent just hadn't checked them yet)
```

**Good:**

```
Agent: "I understand - I'll skip components in src/lib/components/ui/
and focus only on custom components"
```

**Bad:**

```
Agent: "The code is not entirely correct"
(Euphemistic language hiding the truth)
```

**Good:**

```
Agent: "That code is wrong - it creates an infinite loop.
Let me fix it."
```

### The Trust Contract

When working on this codebase:

- Every statement about what you did must be verifiable and true
- Every claim about code behavior must be accurate
- If you make a mistake, acknowledge it directly
- If you're uncertain, say so explicitly

**The human needs to trust that:**

- When you say you checked something, you actually did
- When you say you found N issues, there are actually N issues
- When you say code is correct, it actually is
- When you fix something, it's actually fixed

### Following Best Practices

This project uses:

- **Svelte 5** - Follow modern rune-based patterns, avoid legacy patterns
- **TypeScript** - Full type safety, no `any` types
- **Svelte Autofixer** - Address ALL suggestions, no matter how small
- **Type checking** - Code must pass `pnpm check` with **ZERO errors AND ZERO warnings**

**CRITICAL: Zero-Tolerance for Warnings**
- Warnings are not acceptable, even if the code "works"
- Warnings indicate poor logic or non-adherence to best practices
- NEVER dismiss warnings as "expected" or "safe to ignore"
- If code produces warnings, it must be refactored until warnings are eliminated
- `pnpm check` must show "0 errors and 0 warnings"

When in doubt:

1. Check with the autofixer
2. Verify with TypeScript
3. Test in the browser
4. Ask the human for clarification

Never skip steps to appear faster. Thoroughness and accuracy are more valuable than speed.

### Svelte 5 Runes: Anti-Patterns to Avoid

**NEVER use `$effect` to sync props to state**

This is a common anti-pattern that breaks reactivity and creates unnecessary complexity:

```svelte
<!-- ❌ BAD: Using $effect to sync props to state -->
<script lang="ts">
  let { initialData }: Props = $props();
  let formData = $state({ name: '', email: '' });

  // ANTI-PATTERN: Don't do this!
  $effect(() => {
    if (initialData) {
      formData.name = initialData.name;
      formData.email = initialData.email;
    }
  });
</script>

<!-- ✅ GOOD: Use $derived or direct prop access -->
<script lang="ts">
  let { initialData }: Props = $props();

  // Option 1: Use $derived for computed values
  let displayName = $derived(initialData?.name || '');

  // Option 2: Use props directly in the template
  // Option 3: Initialize state from props once (not reactively)
  let formData = $state({
    name: initialData?.name || '',
    email: initialData?.email || ''
  });
</script>
```

**Why this is wrong:**
- `$effect` is for side effects (DOM manipulation, logging, external APIs)
- Syncing props to state creates two sources of truth
- It breaks Svelte's reactivity model
- It can cause infinite loops and race conditions

**When you need to use prop values:**
1. **Read-only display**: Use `$derived` or access props directly in template
2. **Initialize once**: Set state from props in initial declaration (not reactive)
3. **Two-way binding**: Use `bind:` directive or event callbacks, not effects

### Component Architecture

**Components should be small, dumb, and do one thing well.**

**Core Principles:**

- ✅ **Small components** - Each component should do one thing well
- ✅ **Sub-components** - Break large components into smaller, focused pieces
- ✅ **Dumb components** - Components should be presentational (receive props, emit events)
- ✅ **Externalized logic** - Business logic, calculations, validations, and formatting in utility functions
  - **Avoid duplication**: If the same function appears in multiple components, extract it to a shared utility
  - **Example**: `formatCurrency()` and `formatDateString()` used across multiple list components should live in `src/lib/utils/formatting.ts`

**Size Guidelines:**

- Components handling more than 3-4 related fields should be split
- Aim for components under 100-150 lines (script + template, excluding styles)
- Always consider extracting logic to utility functions

**Example:**

```
❌ BAD: One giant EventPlanningContractForm.svelte with 50 fields and all logic
✅ GOOD: 6 section components + 1 orchestrator + utilities file with business logic
```

**When to split:**

- Component handles multiple unrelated concerns
- Template has distinct sections that could be separate components

### Styling Architecture

**IMPORTANT: Use Tailwind utility-first approach - NO `<style>` blocks in components.**

This project uses Tailwind CSS with a utility-first methodology:

**Core Principles:**

1. **Use Tailwind utilities directly in components** - This is the primary approach
2. **Use app.css to create a design-system**
3. **No component-scoped `<style>` blocks** - Avoid scattered styles across components
4. **Reduce CSS bundle size** - Let Tailwind's tree-shaking optimize the bundle
5. **Avoid `max-w-*` utilities** - Let content use full available width; use responsive grid/flex instead

**Tailwind-First Process:**

1. First, try to achieve the styling with Tailwind utilities
2. Document why custom CSS was necessary

**Common Patterns:**

```svelte
<!-- ✅ GOOD: Pure Tailwind utilities -->
<div class="p-6 bg-white rounded-lg border border-gray-200">
	<h3 class="text-lg font-semibold text-gray-900 mb-6">Title</h3>
	<div class="grid gap-6 grid-cols-[repeat(auto-fit,minmax(250px,1fr))]">
		<!-- Grid items -->
	</div>
</div>

<!-- ✅ GOOD: Conditional classes with error states -->
<input
	class="px-3.5 py-2.5 border rounded-md {error
		? 'border-red-500 focus:ring-red-500/10'
		: 'border-gray-300 focus:ring-blue-500/10'}"
/>

<!-- ✅ GOOD: Full-width grid items -->
<div class="col-span-full">...</div>

<!-- ❌ BAD: Custom CSS classes -->
<div class="form-section">...</div>

<style>
	.form-section {
		padding: 1.5rem;
		background: white;
	}
</style>
```

**Key Tailwind Utilities:**

- Layout: `flex`, `grid`, `col-span-full`, `gap-*`
- Spacing: `p-*`, `m-*`, `space-*`
- Sizing: `w-*`, `h-*`, `min-h-*`, `max-w-*`
- Colors: `bg-*`, `text-*`, `border-*`
- Effects: `rounded-*`, `shadow-*`, `ring-*`
- States: `hover:*`, `focus:*`, `active:*`

**Benefits:**

- Smaller CSS bundle (Tailwind tree-shakes unused utilities)
- Consistent design system (using Tailwind's design tokens)
- Faster development (no context switching between files)
- Better maintainability (styles co-located with markup)

### Component Quality Tracking

**All custom Svelte components must be validated with the Svelte autofixer tool.**

- Track autofixer check status in `AUTOFIXER_STATUS.md`
- Address ALL autofixer suggestions - no exceptions
- Update tracking document after each check
- Run `pnpm check` after fixes to ensure 0 errors and 0 warnings

See `AUTOFIXER_STATUS.md` for current component status and checking progress.

---

## Contract Architecture: Current State & Future Vision

### Current State (Temporary Normalization Approach)

We currently have **separate contract types** for different contract kinds:
- `SavedServiceContract` (service contracts)
- `SavedEventPlanningContract` (event planning contracts)

To display them together, we use a **normalization pattern**:
- `UnifiedContract` interface (common display fields)
- `mergeContracts()` utility (converts specific types → unified format)

**Location:** `src/lib/utils/mergeContracts.ts`

### Target Architecture (Base Contract Interface)

**Vision:** All contract types should share a common base interface with type-safe discrimination.

```typescript
// Future: Base interface with all common fields
interface BaseContract {
  id: string;
  type: 'service' | 'event-planning';
  contractNumber: string;
  createdAt: Timestamp;
  ownerUid: string;
  locationId: string;
  paymentStatus: 'unpaid' | 'paid';
  paidAt: Timestamp | null;
  paidBy: string | null;

  // Common display fields (enforced at type level)
  eventName: string;
  clientName: string;
  location: string;
  date: string;
  contractValue: number;
}

// Specific types extend the base
interface ServiceContract extends BaseContract {
  type: 'service';
  contractData: ContractData;
  status: 'draft' | 'generated';
}

interface EventPlanningContract extends BaseContract {
  type: 'event-planning';
  contractData: EventPlanningContractData;
  paymentDirection: 'receivable' | 'payable';
}
```

### Migration Path: Design for the Future

**Strategy:** Design all new code to work with `UnifiedContract`, treating it as the proto-base interface.

**Guidelines for New Code:**

1. ✅ **Components should consume `UnifiedContract`**, not specific contract types
   - Good: `ContractListItem` accepts `UnifiedContract`
   - Bad: Creating separate `ServiceContractListItem` and `EventPlanningContractListItem`

2. ✅ **Use normalization functions as temporary adapters**
   - `normalizeServiceContract()` and `normalizeEventPlanningContract()` are temporary
   - They will be removed when we refactor to base contracts

3. ✅ **New contract types must provide normalization**
   - If adding a new contract type, create a `normalizeXContract()` function
   - Map fields to `UnifiedContract` format

4. ✅ **Avoid spreading contract-type-specific logic**
   - Don't check `contract.type` everywhere
   - Prefer polymorphism through the unified interface

**When We Refactor:**
- Restructure Firebase schemas to conform to `BaseContract` shape
- Remove normalization functions (`mergeContracts.ts` becomes obsolete)
- Components already work - no changes needed!

**Why This Matters:**
- Prevents technical debt from growing
- Makes eventual refactor much easier
- New features align with target architecture
- Each new component is a step forward, not backward

---

**Last Updated:** 2026-01-03
**Reason:** Added contract architecture vision and guidelines for designing toward future refactor.
