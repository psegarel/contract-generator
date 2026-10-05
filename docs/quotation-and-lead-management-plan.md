# Quotation and Lead Management Plan

## Implementation status — 2026-10-05

The quotation MVP is implemented through most of Phase 4. Phase 5, quotation-to-rental-contract integration, is deferred. The plan below remains the source for product decisions and detailed requirements; this snapshot records what the current code does.

### Implemented

- Firestore quotation and lead types, Zod input schemas, repositories, admin-only rules, and sequential quotation numbers.
- Integer-VND calculations with equipment-only discounts, transport, handling, and validity checks.
- A 14-day default validity period. Transport and handling are stored and displayed separately. VAT is off by default and can be added per quotation. Its 8% shared default is stored in Firestore `app-config/quotation-settings` (`defaultVatRatePercent`), editable without a client rebuild. The form allows a quotation-specific rate and saves the applied rate and amount with the quote. VAT applies after the equipment-only discount to the full pre-VAT total, including transport and handling. The detail view and PDF show VAT only when enabled.
- Protected catalogue-feed loading using the signed-in Firebase ID token, response validation, and an unavailable-feed message. Contract Generator does not connect directly to Neon.
- Quotation list, create, detail, and draft-edit routes; customer snapshots for existing clients and leads; lead creation/deduplication by normalized email; manual status updates; and a lead status list.
- Sent quotations can be revised into a new draft record with the same quotation number and incremented revision. The prior sent record is marked superseded while its issued content is retained. A revision chain is visible from each quotation detail page.
- PDF download using the saved quotation snapshot, with the supplied Insense logo, grayscale styling, embedded Vietnamese-capable text fonts, compact pricing rows, wrapped bottom-aligned notes, and page numbers on multi-page documents. Legal name, tax code, address, representative phone, and email come from the shared environment-backed `companyConfig` used by contract generation.
- Focused tests for calculations, expiry dates, email normalization, catalogue response parsing, and PDF generation without images.

### Remaining work

- Add search and category filtering to the equipment picker. It currently uses a native select over the full catalogue.
- Finish the PDF layout by visually reviewing long quotations, multiple pages, valid images, and mobile/detail-page layouts.
- Add coverage for lead deduplication, customer validation, Firestore serialization/read validation, catalogue failure behavior, image embedding and fallback, and multi-page PDFs.
- Add a deliberate lead-to-client conversion flow if needed. The current lead page only changes the lead's pipeline status to `converted`.
- Implement Phase 5 only if accepted quotations should populate one-off rental contracts. That integration is not in the current application.

Email delivery, public acceptance links, payment collection, automatic expiry jobs, lead scoring, and automated lead-to-client conversion remain outside the initial MVP scope.

## Objective

Add client quotations to Contract Generator. An administrator should be able to:

- create a quotation for an existing client or a new lead;
- select equipment from the Insense Packages catalogue;
- adjust quantities and quotation-specific unit prices;
- apply a discount to equipment items only;
- add transport and handling costs;
- save, edit, list, and track quotations;
- give quotations an explicit validity period; and
- download a branded PDF containing equipment thumbnails when available.

Leads should be tracked in Firestore without automatically creating client counterparties.

## Scope and boundaries

### Contract Generator owns

- quotation and lead records;
- quotation status, validity, revisions, and history;
- client or lead references;
- immutable quotation snapshots;
- quotation calculations;
- quotation PDF generation; and
- the relationship between an accepted quotation and a later rental contract.

### Insense Packages owns

- equipment catalogue items;
- equipment names, descriptions, categories, manufacturers, rental rates, and image URLs;
- equipment inventory and physical units; and
- catalogue administration and catalogue PDF generation.

Contract Generator must not connect directly to the Insense Packages Neon database or copy its source tables into Firestore. The projects remain separate. Equipment access should use a narrow, read-only integration owned by Insense Packages, or a controlled synchronization mechanism if a live integration is not operationally suitable.

## Core design decisions

### Quotations are a separate domain

A quotation is not another contract type. It should have its own Firestore collection and lifecycle. The existing `equipment-rental-oneoff` contract can later reference an accepted quotation and inherit its details.

### Catalogue data is snapshotted, not duplicated

When an item is added to a quotation, copy the relevant commercial information into the quotation line item:

```text
catalogItemId
name
category
manufacturer
unitPriceVnd
quantity
imageUrl
note
```

This is historical document data, not a second equipment catalogue. It ensures that a quotation remains accurate if the catalogue name, price, manufacturer, or image changes later.

### Issued quotations are stable

Draft quotations may be edited. Once a quotation is sent, accepted, declined, or expired, its issued snapshot should not be silently changed. Revising a sent quotation creates a new draft record with the same quotation number, an incremented revision, and a link to its predecessor. The sent record is marked superseded, and every revision remains available in the history. Revisions are currently created from sent quotations.

### Leads are separate from clients

A lead should not be inserted into `counterparties` automatically. A lead can later be converted into a client deliberately, while existing quotations retain their original customer snapshot.

### Firestore is the source of truth

Firestore is the operational source of truth for leads and quotations. External marketing or messaging integrations are deliberately outside the first quotation implementation and can be added later without changing the quotation model.

## Proposed Firestore model

### `quotations/{quotationId}`

```text
quotationNumber
revision
status: draft | sent | accepted | declined | expired | superseded
rootQuotationId
revisionOfId
latestRevisionId?  // stored on the root record to serialize revision creation
latestRevision?    // latest revision number stored on the root record

customer:
  type: existing-client | lead
  clientId?
  leadId?
  name
  companyName?
  email?
  phone?
  address?

lineItems[]:
  catalogItemId
  name
  category
  manufacturer?
  quantity
  unitPriceVnd
  imageUrl?
  note?

equipmentSubtotalVnd
equipmentDiscountPercent
equipmentDiscountVnd
transportVnd
handlingVnd
vatRatePercent  // null when VAT is not requested
vatAmountVnd    // 0 when VAT is not requested
totalVnd

validUntil
eventName?
eventDate?
venue?
notes?

createdAt
updatedAt
sentAt?
acceptedAt?
declinedAt?
expiredAt?
ownerUid
```

All monetary values should be integer VND values. The calculation is:

```text
equipment subtotal
- equipment discount
+ transport
+ handling
= pre-VAT total
optional VAT (default rate 8%, configured in `app-config/quotation-settings`)
= total including VAT when enabled; otherwise pre-VAT total
```

The discount must never reduce transport or handling costs.

The application should store both the input values and calculated totals so that the issued document can be audited. Calculation helpers must be pure, shared by the form and persistence validation, and covered by unit tests.

### `leads/{leadId}`

```text
name
companyName?
email
phone?
address?
source: quotation | catalogue | manual | other
status: new | contacted | qualified | converted | lost
quotationIds[]
createdAt
updatedAt
ownerUid
```

Lead deduplication should be based primarily on normalized email, with deliberate handling for leads without email addresses. Existing clients should still be snapshotted inside quotations even when the quotation references a `clientId`.

## Equipment catalogue integration

The preferred integration is a protected, read-only endpoint owned by Insense Packages. It should return only the fields required by the quotation picker:

```text
id
name
description
category
manufacturer
rentalRateVnd
imageUrl
outsourced
```

Contract Generator accesses the protected endpoint with the signed-in Firebase ID token. Insense Packages validates that token against its configured Firebase project and quotation-user allow-list before querying Neon. No Neon credentials or integration secret are exposed to the browser. The catalogue response is small, cacheable, and suitable for search/filtering in the quotation form; the adapter validates it and deliberately fails closed when the feed is not configured.

Before implementation, confirm:

- which Firebase users are allowed to consume the integration and which origin is allowed;
- whether ImageKit image URLs are fetchable by the PDF renderer;
- whether a server-side proxy is needed for image fetching; and
- whether the catalogue endpoint should expose all equipment or only quoteable equipment.

If a live endpoint cannot be deployed safely, implement a controlled, authenticated catalogue sync instead. Do not introduce a direct Neon dependency in Contract Generator.

## Lead management

Creating a quotation for a lead creates or reuses a Firestore lead record, normalizing the email address to avoid duplicate lead records. The lead stores its quotation IDs and a simple pipeline status so the application can track follow-up without depending on an external CRM or marketing service.

Future integrations may consume the Firestore lead records, but they must remain optional and must not make quotation creation fail.

## User interface

Add the following routes:

```text
/quotations
/quotations/new
/quotations/[id]
/quotations/[id]/edit
```

The creation form should provide:

- existing client versus new lead selection;
- lead details;
- equipment search, filtering, and thumbnail selection;
- quantity editing;
- quotation-specific unit price editing;
- equipment discount percentage;
- transport and handling inputs;
- validity period or expiry date;
- optional event and venue information;
- a live financial summary; and
- draft save and PDF download actions.

The summary should clearly separate equipment subtotal, discount, logistics costs, and final total. The detail page should show the quotation status, expiry, lead/client information, line-item snapshot, and available actions.

## PDF generation

Create a quotation-specific PDF renderer. Do not adapt the existing DOCX contract templates.

The PDF should include:

- Insense branding;
- quotation number, issue date, revision, and validity date;
- client or lead details;
- an equipment table grouped by category;
- small thumbnails with a placeholder when no image is available;
- quantity, unit price, and line totals;
- equipment subtotal and discount;
- transport and handling costs;
- VAT rate and amount when enabled, followed by the VAT-inclusive final total;
- final total without a VAT line when VAT is disabled;
- terms, notes, and contact information; and
- page numbers or a consistent footer.

The renderer should use the quotation snapshot only. It should not fetch live prices during PDF generation. `pdf-lib` is the preferred starting point because Insense Packages already uses it successfully for thumbnail-based catalogue PDFs. Image failures should omit the image or use a placeholder without preventing the quotation from downloading.

## Relationship to rental contracts

The current one-off rental contract stores `quotationReference` and a free-text `equipmentList`. After the quotation MVP is stable:

- allow a one-off rental contract to select an accepted quotation;
- store the quotation ID and number on the contract;
- populate the contract equipment and financial fields from the quotation snapshot; and
- retain the existing manual workflow for older contracts.

This integration should be a later phase, not a prerequisite for creating and downloading quotations.

## Implementation phases

### Phase 0 — confirm decisions and integration constraints

- Confirm default quotation validity period.
- Resolved: VAT is optional per quotation, with a configurable 8% default. Apply it to the full pre-VAT total, after the equipment-only discount and including transport and handling.
- Confirm whether transport and handling remain separate lines.
- Resolved: a sent quotation is revised into a new draft revision; its prior record is retained as superseded history.
- Confirm event and venue fields.
- Confirm catalogue endpoint authentication and deployment ownership.

### Phase 1 — domain foundation

- Add quotation and lead TypeScript types.
- Add Zod schemas.
- Add pure quotation calculation helpers.
- Add status and validity helpers.
- Add quotation number/sequence strategy.
- Add Firestore repository functions.
- Add Firestore authorization rules.

Deliverable: validated quotation and lead data can be created, read, updated, and listed without UI changes to existing contracts.

### Phase 2 — catalogue integration

- Implement the read-only catalogue contract.
- Add server-side authentication for the integration.
- Add catalogue loading, filtering, and error handling in Contract Generator.
- Add tests for response validation and unavailable-catalogue behavior.

Deliverable: the quotation form can select current equipment without a Neon dependency in Contract Generator.

### Phase 3 — quotation and lead UI

- Add quotation routes and navigation.
- Build the client/lead selector.
- Build the equipment picker and line-item editor.
- Add pricing, discount, transport, handling, and validity controls.
- Add draft save, edit, detail, list, and status actions.
- Add lead creation and deduplication behavior.

Every created or modified Svelte component must run through the project Svelte autofixer, followed by `pnpm check` with zero errors and zero warnings.

### Phase 4 — quotation PDF

- Add the PDF renderer and branded layout.
- Add thumbnail embedding and placeholder behavior.
- Add multi-page line-item layout.
- Add browser download handling.
- Add PDF generation tests and a manual visual review.

### Phase 5 — rental contract integration

- Add accepted-quotation selection to one-off rental contracts.
- Populate contract data from the quotation snapshot.
- Preserve manual quotation references for existing records.

## Testing and verification

At minimum, add tests for:

- equipment subtotal calculation;
- discount applying only to equipment;
- transport and handling totals;
- zero and maximum discounts;
- integer VND handling;
- validity and expiry behavior;
- lead deduplication;
- existing-client versus lead validation;
- catalogue response validation;
- Firestore quotation serialization; and
- PDF generation with missing, valid, and unsupported images.

Run the relevant checks after each phase:

```sh
pnpm check
pnpm test:server -- --run
pnpm test:client -- --run
pnpm build
pnpm lint
```

Browser and PDF output also require manual checks at desktop and mobile widths, including long equipment names, many line items, missing images, and expired quotations.

## Initial MVP boundary

The first release should include:

- existing clients and leads;
- Firestore lead and quotation records;
- current catalogue selection through the approved integration;
- immutable item snapshots;
- equipment-only discounts;
- transport and handling;
- quotation validity dates;
- draft/sent/expired status handling;
- downloadable quotation PDFs with thumbnails.

Emailing quotations, public acceptance links, payment collection, automated expiry jobs, lead scoring, and full quotation-to-contract conversion can follow after the MVP is being used in practice.
