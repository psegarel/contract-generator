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

The design-system cleanup plan is mostly complete. Type checking and production build pass, but the repository still has incomplete test coverage, several oversized forms, four contract types with backend code but no creation routes, and a few smaller code-cleanup items.

### Work completed in this session

- Reviewed the project architecture, routes, plan, status documents, tests, and Firebase rules.
- Added this codebase review document.
- Migrated all three payment filters in `src/routes/payments/+page.svelte` from native `<select>` elements to `SelectField`.
- Added an optional `labelHidden` prop to `src/lib/components/SelectField.svelte` so compact filters retain accessible labels without changing their layout.
- Ran `pnpm check` after the migration: 0 errors and 0 warnings.
- Configured Svelte MCP in the user-level Codex configuration. The next session must be restarted before the MCP tools are available.

### Cleanup status update — 2026-10-04

- The avatar cleanup is complete. `src/lib/components/ui/avatar/` contains only `avatar.svelte` and `index.ts`; `AppShell.svelte` imports the consolidated component.
- The generic hardcoded-color migration is complete. A source scan found remaining generic gray and white classes only in `ServiceProvisionContractPreview.svelte` and `EventPlanningContractPreview.svelte`. Those classes preserve fixed white-page, black-text contract previews for printing.
- The manual visual spot-check and dark-mode review listed in the archived cleanup plan have not been verified, so those remain follow-up work.
- The project is pinned to Node 22.18.0 in `.nvmrc`, and login shells select the NVM project version automatically. The separate Homebrew OpenCode 1.2.0 and Node 25.6.1 installations were removed; Homebrew showed OpenCode was the only installed formula depending on Node.
- Authorization review: all application data and uploaded documents in the current Firestore and Storage rules require an `isAdmin()` profile. User profiles cannot self-promote. This matches the documented single-owner model; no unrestricted signed-in-user access to application data was found. The rules do not have match blocks for venue-rental, performer-booking, subcontractor, or client-service collections, so those backend-only collection operations are denied by default.
- The contract type selector no longer offers the four contract types without creation routes, avoiding links to 404s. Their backend code and payment integrations remain while roadmap status and any existing Firestore records are unverified.

## Previous cleanup plan status

The plan in `plans/steady-jingling-lecun.md` is mostly implemented. The codebase now has shared `TextField`, `TextareaField`, `SelectField`, and `FormSection` components, and raw buttons have been migrated to the shared Button component.

Remaining plan-related work:

1. Complete the planned visual and dark-mode checks.

The avatar consolidation and generic hardcoded-color review are complete. The only remaining generic gray and white classes are in the two print-oriented contract previews, where fixed colors are intentional. Status, financial, warning, and category colors also remain explicit where they communicate meaning.

## Recommended next work

### High priority

Four contract types have backend schemas, CRUD utilities, and state management but no creation routes:

- Venue rental
- Performer booking
- Subcontractor
- Client service

Decide whether these are real roadmap features. Either build the routes/forms and add matching Firestore rules, or remove their unused backend stacks and payment integrations. Existing Firestore data has not been inspected, so verify whether records exist before deleting their support.

The current rules match the single-owner `isAdmin` access model. If the app adds multiple administrators or ordinary users who need access to records, revisit whether collection-level admin access should be narrowed by `ownerUid`.

### Medium priority

- Replace the remaining production `as any` counterparty casts with type guards.
- Remove unused payment migration exports and the unused `SERVICE_TYPES` constant.
- Split the largest forms into smaller section components. The largest are rental, DJ residency, event planning, and counterparty forms.
- Expand automated coverage beyond the current small unit/browser smoke-test set.

### Documentation and tooling

The stale status/context documents and the component README should be consolidated or archived. The root `README.md` has now been replaced with project-specific documentation. `pnpm lint` still needs cleanup: Prettier reports many files needing formatting, although the invalid illustrative snippets from the component README are now archived.

## Verification performed at review time

- `pnpm check` — passed with 0 errors and 0 warnings
- `pnpm build` — passed
- `pnpm vitest run --project server` — passed, 1 test
- `pnpm lint` — failed at the Prettier stage due to formatting/documentation issues
- Full browser test execution was not completed in the sandbox because Vitest was denied permission to bind to `::1`

### Follow-up verification — 2026-10-04

- Before the NVM shell fix, default `pnpm check` selected the broken Node 25 binary; using Node 22.23.2 manually passed with 0 errors and 0 warnings.
- After the fix and Homebrew cleanup, a new tool login shell selected Node 22.18.0 via `.nvmrc`; `pnpm check` passed with 0 errors and 0 warnings. `brew list --versions node opencode` returned no installed versions.
- Source scan — remaining generic gray and white color classes are limited to the two contract preview components described above.

## Suggested sequence

1. Decide the fate of the four backend-only contract types. Confirm whether Firestore records exist before removing any backend support.
2. Complete the planned visual and dark-mode checks.
3. Replace the remaining production `as any` counterparty casts and remove unused payment migration exports and `SERVICE_TYPES`.
4. Improve test coverage and split the largest forms.
5. Revisit record-level ownership rules if the application moves beyond its current single-owner access model.
6. Consolidate stale project documentation and restore a clean lint check.
