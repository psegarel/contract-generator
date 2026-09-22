# Codebase Review — 2026-09-22

## Project snapshot

Contract Generator is a SvelteKit/Svelte 5 application backed by Firebase Authentication, Firestore, and Storage. It generates bilingual English/Vietnamese contracts as DOCX and HTML documents.

Current user-facing areas include:

- Service provision, event planning, equipment rental, one-off rental, and DJ residency contracts
- Client and contractor counterparties
- Events and payment tracking
- Shared form and design-system components

The working tree was clean at the start of this review. The review document and payment-filter migration were then added; subsequent documentation cleanup is now tracked in the working tree separately.

## Agent tooling

Svelte MCP is configured in `.mcp.json` for Codex sessions:

- Project-level `.mcp.json` points to `https://mcp.svelte.dev/mcp`.
- User-level Codex configuration includes the `svelte` MCP server and enables the remote MCP client.
- The server is available to sessions after the MCP configuration has been loaded.

## Agent handoff

### Findings

The design-system cleanup plan is mostly complete. Type checking and production build pass, but the repository still has small cleanup items, stale documentation, incomplete test coverage, several oversized forms, four backend-only contract types, and authorization rules that should be reviewed before further feature expansion.

### Work completed in this session

- Reviewed the project architecture, routes, plan, status documents, tests, and Firebase rules.
- Added this codebase review document.
- Migrated all three payment filters in `src/routes/payments/+page.svelte` from native `<select>` elements to `SelectField`.
- Added an optional `labelHidden` prop to `src/lib/components/SelectField.svelte` so compact filters retain accessible labels without changing their layout.
- Ran `pnpm check` after the migration: 0 errors and 0 warnings.
- Configured Svelte MCP in the user-level Codex configuration. The next session must be restarted before the MCP tools are available.

### Next step

Remove the unused avatar wrapper files:

- `src/lib/components/ui/avatar/avatar-image.svelte`
- `src/lib/components/ui/avatar/avatar-fallback.svelte`

After that deletion, run `pnpm check` and pause for user confirmation before moving to the remaining hardcoded-color review.

## Previous cleanup plan status

The plan in `plans/steady-jingling-lecun.md` is mostly implemented. The codebase now has shared `TextField`, `TextareaField`, `SelectField`, and `FormSection` components, and raw buttons have been migrated to the shared Button component.

Remaining plan-related work:

1. Remove the unused `ui/avatar/avatar-image.svelte` and `ui/avatar/avatar-fallback.svelte` files.
2. Finish or explicitly scope the remaining hardcoded colors. Many are intentional status colors or print-preview styles and should be reviewed deliberately.
3. Complete the planned visual and dark-mode checks.

## Recommended next work

### High priority

Four contract types have backend schemas, CRUD utilities, and state management but no UI:

- Venue rental
- Performer booking
- Subcontractor
- Client service

Decide whether these are real roadmap features. Either build their routes/forms or remove their unused backend stacks and payment integrations.

Review authorization rules in `firestore.rules` and `storage.rules`. Most V2 records currently allow any authenticated user to read or write them. Confirm whether that is intentional; otherwise add ownership and/or role checks.

### Medium priority

- Replace the remaining production `as any` counterparty casts with type guards.
- Remove unused payment migration exports and the unused `SERVICE_TYPES` constant.
- Split the largest forms into smaller section components. The largest are rental, DJ residency, event planning, and counterparty forms.
- Expand automated coverage beyond the current small unit/browser smoke-test set.

### Documentation and tooling

The stale status/context documents and the component README should be consolidated or archived. The root `README.md` has now been replaced with project-specific documentation. `pnpm lint` still needs cleanup: Prettier reports many files needing formatting, although the invalid illustrative snippets from the component README are now archived.

## Verification performed

- `pnpm check` — passed with 0 errors and 0 warnings
- `pnpm build` — passed
- `pnpm vitest run --project server` — passed, 1 test
- `pnpm lint` — failed at the Prettier stage due to formatting/documentation issues
- Full browser test execution was not completed in the sandbox because Vitest was denied permission to bind to `::1`

## Suggested sequence

1. Finish the small remaining items from the cleanup plan.
2. Decide the fate of the four backend-only contract types.
3. Review authorization rules before adding more features.
4. Improve test coverage and split the largest forms.
5. Consolidate project documentation and restore a clean lint check.
