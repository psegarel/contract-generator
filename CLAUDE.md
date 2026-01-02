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
- **Type checking** - Code must pass `pnpm check` with zero errors

When in doubt:

1. Check with the autofixer
2. Verify with TypeScript
3. Test in the browser
4. Ask the human for clarification

Never skip steps to appear faster. Thoroughness and accuracy are more valuable than speed.

### Component Architecture

**Components should be small, dumb, and do one thing well.**

**Core Principles:**

- ✅ **Small components** - Each component should do one thing well
- ✅ **Sub-components** - Break large components into smaller, focused pieces
- ✅ **Dumb components** - Components should be presentational (receive props, emit events)
- ✅ **Externalized logic** - Business logic, calculations, and validations in utility functions

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
2. \*\*Use app.css to create a design-system
3. **No component-scoped `<style>` blocks** - Avoid scattered styles across components
4. **Reduce CSS bundle size** - Let Tailwind's tree-shaking optimize the bundle

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

---
