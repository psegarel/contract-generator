# v2 Components

This directory contains the refactored component library built on the v2 architecture with TypeScript inheritance and type-safe base interfaces.

## Architecture Benefits

### The Key Insight: ONE Component for ALL Contract Types

The v2 architecture eliminates UI duplication through TypeScript interface inheritance. Instead of creating 7 separate list components for 7 contract types, we have **ONE** `ContractListItem` component that works for ALL types.

**How it works:**
```typescript
// BaseContract has minimal common fields for display
interface BaseContract {
  id: string;
  type: ContractType;
  contractNumber: string;
  eventName: string;  // Denormalized for performance
  counterpartyName: string;  // Denormalized for performance
  contractValue: number;
  paymentDirection: 'receivable' | 'payable';
  paymentStatus: 'unpaid' | 'paid';
  createdAt: Timestamp;
  // ... minimal common fields
}

// Specific types extend BaseContract
interface VenueRentalContract extends BaseContract {
  type: 'venue-rental';
  rentalStartDateTime: string;  // Type-specific fields
  venueCapacity: number;
  // ... venue-specific fields
}

// Component accepts base type - works for ALL 7 contract types!
interface Props {
  contract: BaseContract;  // ✅ Accepts any contract type
}
```

### No Merge Functions Needed

TypeScript inheritance allows array spreading without explicit merge utilities:

```typescript
// This just works - TypeScript knows all types extend BaseContract!
const allContracts: BaseContract[] = [
  ...venueRentalContractState.contracts,
  ...performerBookingContractState.contracts,
  ...equipmentRentalContractState.contracts,
  ...serviceProvisionContractState.contracts,
  ...eventPlanningContractState.contracts,
  ...subcontractorContractState.contracts,
  ...clientServiceContractState.contracts
].sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
```

**No `mergeContracts()` function needed!** The old v1 system required normalization functions. v2 eliminates this entirely.

## Component Structure

```
v2/
├── contracts/
│   ├── ContractListItem.svelte       # ✅ Works for ALL 7 contract types!
│   ├── ContractsList.svelte          # Reusable list component
│   ├── LatestContractsList.svelte    # Dashboard widget (merges all types)
│   ├── forms/                        # (TODO) Contract creation forms
│   └── index.ts                      # Re-exports
├── events/
│   ├── EventCard.svelte              # Event display card
│   └── index.ts
├── counterparties/
│   ├── CounterpartyCard.svelte       # ✅ Works for ALL 5 counterparty types!
│   └── index.ts
└── index.ts                          # Main entry point
```

## Component Examples

### ContractListItem

**The star of the refactor** - displays any contract type using common `BaseContract` fields.

```svelte
<script>
  import { ContractListItem } from '$lib/components/v2';
  import type { BaseContract } from '$lib/types/v2';

  // Can be VenueRentalContract, PerformerBookingContract, ANY type!
  let contract: BaseContract = ...;
</script>

<ContractListItem {contract} index={0} />
```

**Key features:**
- Responsive (mobile stack, desktop grid)
- Payment direction badges (AR/AP)
- Payment status badges (Paid/Unpaid)
- Direct navigation to contract detail
- Pure Tailwind CSS (no `<style>` blocks)

### LatestContractsList

Dashboard widget that demonstrates the power of TypeScript inheritance:

```svelte
<script>
  import { LatestContractsList } from '$lib/components/v2';
</script>

<!-- Shows latest 10 contracts from ALL types, merged and sorted -->
<LatestContractsList limit={10} />
```

**How it works:**
```typescript
// Merges all contract types - TypeScript handles compatibility
let allContracts = $derived<BaseContract[]>(
  [
    ...venueRentalContractState.contracts,
    ...serviceProvisionContractState.contracts,
    ...eventPlanningContractState.contracts,
    // Add more types as needed - no code changes required!
  ]
    .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
    .slice(0, limit)
);
```

### EventCard

Displays event summary with financial rollup:

```svelte
<script>
  import { EventCard } from '$lib/components/v2';
  import type { Event } from '$lib/types/v2';

  let event: Event = ...;
</script>

<EventCard {event} />
```

**Shows:**
- Event name, type, status
- Date and location
- Financial summary (receivable, payable, net revenue)
- Contract count
- Navigation to event detail

### CounterpartyCard

Displays any counterparty type (venue, performer, client, supplier, service-provider):

```svelte
<script>
  import { CounterpartyCard } from '$lib/components/v2';
  import type { Counterparty } from '$lib/types/v2';

  // Can be VenueCounterparty, PerformerCounterparty, ANY type!
  let counterparty: Counterparty = ...;
</script>

<CounterpartyCard {counterparty} />
```

**Shows:**
- Name and type badge
- Contact information (email, phone, address)
- Notes (if present)
- Navigation to counterparty detail and contracts

## Design Patterns

### 1. Pure Tailwind CSS

All components use Tailwind utilities directly - no `<style>` blocks.

```svelte
<!-- ✅ GOOD: Pure Tailwind -->
<div class="p-6 bg-white rounded-lg border border-gray-200">
  <h3 class="text-lg font-semibold mb-4">Title</h3>
</div>

<!-- ❌ BAD: Custom CSS -->
<div class="card">
  <h3 class="card-title">Title</h3>
</div>
<style>
  .card { padding: 1.5rem; }
</style>
```

### 2. Svelte 5 Runes

All components use modern Svelte 5 patterns:

```svelte
<script lang="ts">
  // Props with destructuring
  let { contract, index }: Props = $props();

  // Derived values
  let statusBadge = $derived(getStatusBadge(contract.status));

  // Effects for lifecycle
  $effect(() => {
    contractState.init();
    return () => contractState.destroy();
  });
</script>
```

### 3. Responsive Design

Mobile-first with responsive breakpoints:

```svelte
<!-- Mobile: Stacked layout -->
<div class="md:hidden space-y-4">
  <!-- Stacked content -->
</div>

<!-- Desktop: Grid layout -->
<div class="hidden md:grid grid-cols-18 gap-3">
  <!-- Grid columns -->
</div>
```

### 4. Loading/Error/Empty States

All list components handle all states:

```svelte
{#if isLoading}
  <div class="animate-spin ...">Loading...</div>
{:else if hasError}
  <div class="text-destructive">Error loading data</div>
{:else if items.length === 0}
  <div class="text-muted-foreground">No items yet</div>
{:else}
  <!-- Actual content -->
{/if}
```

### 5. Type-Safe Badge Helpers

Badge configurations use exhaustive type checking:

```typescript
function getStatusBadge(status: Event['status']) {
  const badges: Record<Event['status'], BadgeConfig> = {
    'planning': { variant: 'default', label: 'Planning', class: 'bg-blue-500' },
    'confirmed': { variant: 'default', label: 'Confirmed', class: 'bg-cyan-500' },
    'in-progress': { variant: 'default', label: 'In Progress', class: 'bg-amber-500' },
    'completed': { variant: 'default', label: 'Completed', class: 'bg-emerald-500' },
    'cancelled': { variant: 'secondary', label: 'Cancelled', class: '' }
  };
  return badges[status];  // TypeScript ensures all cases handled!
}
```

## Formatting Utilities

Use shared formatting functions to avoid duplication:

```typescript
import { formatCurrency, formatDateString } from '$lib/utils/formatting';

// Format currency (Vietnamese Dong)
formatCurrency(1000000)  // "₫1,000,000"

// Format dates
formatDateString("2026-01-15")  // "Jan 15, 2026"
```

## Adding New Components

When creating new components:

1. **Use TypeScript** - No `any` types
2. **Pure Tailwind** - No `<style>` blocks
3. **Svelte 5 Runes** - Use `$props`, `$derived`, `$effect`
4. **Responsive** - Mobile-first design
5. **Accessible** - Use semantic HTML and ARIA labels
6. **Small & Focused** - Components under 150 lines
7. **Export** - Add to index.ts

## Testing Components

Run type checking:
```bash
pnpm check
```

All components must pass with **0 errors and 0 warnings**.

## Migration from v1

**Old pattern (v1):**
```typescript
// Needed separate components for each type
<ServiceContractListItem contract={serviceContract} />
<EventPlanningContractListItem contract={eventPlanningContract} />
// ... 7 different components

// Needed merge function
const unified = mergeContracts(serviceContracts, eventPlanningContracts);
```

**New pattern (v2):**
```typescript
// ONE component for ALL types!
<ContractListItem contract={anyContract} />

// NO merge function needed - TypeScript handles it
const all: BaseContract[] = [...venueContracts, ...performerContracts, ...];
```

## Future Additions

Components to be added in future iterations:

- **Forms** - Contract creation/editing forms for each type
- **Detail Views** - Full contract/event/counterparty detail pages
- **Type Selectors** - Wizards for choosing contract/counterparty types
- **Dashboard Widgets** - Financial summaries, upcoming events, unpaid contracts
- **Search/Filter** - Contract and counterparty search components

---

**Last Updated:** 2026-01-04
**Architecture:** v2 with TypeScript inheritance and base interfaces
