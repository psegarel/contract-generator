# Form orchestration

Form components should focus on rendering fields, displaying state, and wiring user events. Form-specific business workflows belong here.

## Boundaries

- `src/lib/state/v2/*FormState.svelte.ts` owns reactive field state, defaults, initialization, and simple derived values.
- `src/lib/forms/` owns form orchestration: prerequisite checks, input payload construction, validation, save/update flows, and related side effects such as payment record updates.
- `src/lib/utils/v2/` owns reusable domain operations and Firebase access. Form workflows may call these functions but should not duplicate their implementation.
- `src/lib/components/` owns presentation and UI-only behavior. Section components receive state and focused callbacks; they do not save contracts or create payment records.
- `src/lib/schemas/` remains the source of truth for persisted input validation.

## Structure

Use one module per workflow rather than a generic form controller:

```text
src/lib/forms/
├── contracts/
│   ├── djResidency.ts
│   ├── equipmentRental.ts
│   └── ...
├── counterparties/
│   ├── client.ts
│   └── ...
└── payments/
    └── ...
```

Modules should expose small, typed functions such as:

- `build...Input(...)` for pure payload construction;
- `validate...Prerequisites(...)` for user-facing checks that happen before schema validation;
- `save...Form(...)` for the complete create/update workflow when persistence and side effects belong together.

Pass plain typed data into these functions where practical. Keep Svelte component instances and DOM details out of this layer so the workflows can be unit tested without rendering components.

Do not extract a helper merely to make a component shorter. Extract logic when it is business behavior, has side effects, is reused, or can be tested independently.
