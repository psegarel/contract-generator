# V2 Migration Plan

## Overview

This migration converts the existing v1 contract system to the new v2 architecture with proper entity relationships and TypeScript inheritance.

## Migration Goals

1. **Zero data loss** - All existing data preserved and accessible
2. **Non-destructive** - V1 collections remain untouched (read-only)
3. **Reversible** - Can roll back if issues discovered
4. **Dry-run capable** - Test migration without writing to database

## Data Mapping

### 1. Clients → Counterparties

**Source:** `clients` collection
**Destination:** `counterparties` collection
**Type:** ClientCounterparty

**Field Mapping:**
```typescript
// V1 Client
{
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  idDocument: string;
  taxId: string | null;
  bankName: string | null;
  accountNumber: string | null;
  documents?: { image1?, image2? };
}

// V2 ClientCounterparty
{
  id: string;  // SAME ID (preserve references)
  type: 'client';
  name: string;  // name
  email: string | null;  // email
  phone: string | null;  // phone
  address: string | null;  // address

  clientType: 'individual' | 'company';  // NEW: infer from data
  companyName: string | null;  // NEW: null for now
  representativeName: string | null;  // NEW: null for now
  representativePosition: string | null;  // NEW: null for now

  idDocument: string | null;  // idDocument
  taxId: string | null;  // taxId
  bankName: string | null;  // bankName
  bankAccountNumber: string | null;  // accountNumber

  createdAt: Timestamp;  // NEW: use serverTimestamp()
  updatedAt: Timestamp;  // NEW: use serverTimestamp()
  ownerUid: string;  // NEW: extract from client query
  notes: string | null;  // NEW: null
}
```

**Default Values:**
- `clientType`: All clients default to 'individual' (manually update to 'company' post-migration if needed)
- Note: Tax ID presence doesn't reliably indicate company vs individual (individuals can have personal tax IDs)

### 2. Service Contracts → Events + Service Provision Contracts

**Source:** `service-contracts` collection
**Destination:**
- `events` collection (new Event entities)
- `service-provision-contracts` collection (migrated contracts)

**Step 1: Create Events**

For each service contract, create an Event:

```typescript
// V1 SavedServiceContract
{
  id: string;
  type: 'service';
  contractData: {
    jobName: string;
    jobContent: string;
    eventLocation: string;
    startDate: string;
    endDate: string;
    // ... more fields
  };
  contractNumber: string;
  locationId: string;  // References client
  // ...
}

// V2 Event
{
  id: string;  // NEW: generate new ID
  ownerUid: string;  // contract.ownerUid
  createdAt: Timestamp;  // contract.createdAt
  updatedAt: Timestamp;  // contract.createdAt

  name: string;  // contractData.jobName
  eventType: 'Service Provision';  // NEW
  description: string | null;  // contractData.jobContent

  locationAddress: string;  // contractData.eventLocation
  locationName: string | null;  // null
  venueCounterpartyId: string | null;  // null

  eventDate: string;  // contractData.startDate
  startTime: string | null;  // contractData.firstPerformanceTime
  endTime: string | null;  // null
  setupDateTime: string | null;  // null
  teardownDateTime: string | null;  // null

  expectedAttendance: number | null;  // null

  status: 'completed';  // NEW: assume past events are completed

  contractIds: [contract.id];  // Link to contract

  totalReceivable: number;  // contract.contractData.fee (with tax)
  totalPayable: 0;
  netRevenue: number;  // totalReceivable

  internalNotes: string | null;  // null
}
```

**Step 2: Migrate Service Contracts**

```typescript
// V1 SavedServiceContract
// (see above)

// V2 ServiceProvisionContract
{
  id: string;  // SAME ID (preserve)
  type: 'service-provision';

  eventId: string;  // NEW: ID of created event
  counterpartyId: string;  // locationId (client reference)

  contractNumber: string;  // contractNumber
  contractValue: number;  // contractData.fee (with tax)
  paymentDirection: 'receivable';  // NEW

  paymentStatus: 'unpaid' | 'paid';  // paymentStatus
  paidAt: Timestamp | null;  // paidAt
  paidBy: string | null;  // paidBy

  createdAt: Timestamp;  // createdAt
  updatedAt: Timestamp;  // createdAt
  ownerUid: string;  // ownerUid

  // Service-specific fields from contractData
  jobName: string;
  jobContent: string;
  numberOfPerformances: number;
  firstPerformanceTime: string;
  startDate: string;
  endDate: string;
  taxRate: number;
  netFee: number;
  status: 'draft' | 'generated';
  bankName: string;
  accountNumber: string;
  clientEmail: string;
  clientAddress: string;
  clientPhone: string;
  clientIdDocument: string;
  clientTaxId: string | null;
  eventLocation: string;
}
```

### 3. Event Planning Contracts → Events + Event Planning Contracts

**Source:** `event-planning-contracts` collection
**Destination:**
- `events` collection (new Event entities)
- `event-planning-contracts` collection (update in-place with new fields)

**Step 1: Create Events**

```typescript
// V1 SavedEventPlanningContract
{
  id: string;
  type: 'event-planning';
  contractData: {
    eventName: string;
    eventVenue: string;
    eventDate: string;
    // ...
  };
  contractNumber: string;
  locationId: string;  // References client
  // ...
}

// V2 Event
{
  id: string;  // NEW: generate new ID
  ownerUid: string;  // contract.ownerUid
  createdAt: Timestamp;  // contract.createdAt
  updatedAt: Timestamp;  // contract.createdAt

  name: string;  // contractData.eventName || contractData.eventType || 'Event Planning'
  eventType: string | null;  // contractData.eventType
  description: string | null;  // contractData.eventDescription

  locationAddress: string;  // contractData.eventVenue
  locationName: string | null;  // contractData.eventVenue
  venueCounterpartyId: string | null;  // null

  eventDate: string;  // contractData.eventDate
  startTime: string | null;  // extract from setupCommencementTime
  endTime: string | null;  // null
  setupDateTime: string | null;  // contractData.technicalSetupDate
  teardownDateTime: string | null;  // contractData.breakdownCompletionDateTime

  expectedAttendance: number | null;  // parse contractData.expectedAttendance

  status: 'completed';  // NEW: assume past events are completed

  contractIds: [contract.id];  // Link to contract

  totalReceivable: number;  // contractData.contractValueVND (if receivable)
  totalPayable: number;  // contractData.contractValueVND (if payable)
  netRevenue: number;  // calculate based on direction

  internalNotes: string | null;  // null
}
```

**Step 2: Update Event Planning Contracts**

Add new fields to existing documents (in-place update):

```typescript
// Add these fields to existing event-planning-contracts documents
{
  eventId: string;  // NEW: ID of created event
  counterpartyId: string;  // NEW: locationId (client reference)
  updatedAt: Timestamp;  // NEW: serverTimestamp()

  // All other fields remain unchanged
}
```

## Migration Order

**CRITICAL: Must execute in this order to maintain referential integrity**

1. **Migrate Clients → Counterparties**
   - Creates counterparty entities first
   - Preserves original IDs so contracts can reference them

2. **Create Events from Service Contracts**
   - Generates Event entities for service contracts
   - Returns mapping: { contractId → eventId }

3. **Migrate Service Contracts → Service Provision Contracts**
   - Uses event mapping from step 2
   - Uses existing client IDs as counterpartyId

4. **Create Events from Event Planning Contracts**
   - Generates Event entities for event planning contracts
   - Returns mapping: { contractId → eventId }

5. **Update Event Planning Contracts**
   - Uses event mapping from step 4
   - Adds eventId and counterpartyId fields in-place

## Safety Mechanisms

### 1. Dry-Run Mode

All migration scripts accept `dryRun: boolean` parameter:
- `true`: Log what WOULD happen, no database writes
- `false`: Execute migration and write to database

### 2. Read-Only Source Collections

Migration scripts only READ from v1 collections:
- `clients` - read only
- `service-contracts` - read only
- `event-planning-contracts` - read only (except in-place updates for new fields)

### 3. Write-Only Destination Collections

Migration scripts only WRITE to v2 collections:
- `counterparties` - write only (create new docs)
- `events` - write only (create new docs)
- `service-provision-contracts` - write only (create new docs)

Exception: `event-planning-contracts` gets in-place field additions.

### 4. ID Preservation

- Clients: Use same ID in counterparties (preserve references)
- Service contracts: Use same ID in service-provision-contracts
- Event planning contracts: Keep same ID, update in-place
- Events: Generate new IDs (new entity type)

### 5. Logging

All migration scripts log:
- Total documents to migrate
- Progress (every 10 documents)
- Errors (with document ID and details)
- Summary (success count, error count, duration)

### 6. Error Handling

- Each document migration wrapped in try-catch
- Errors logged but don't stop entire migration
- Failed documents collected for retry

## Rollback Plan

If migration fails or v2 has critical issues:

1. **Stop using v2 routes** - Revert navigation to v1 routes
2. **Keep v2 collections** - Don't delete (for investigation)
3. **V1 remains functional** - Original collections untouched
4. **Investigate issues** - Review logs, fix code
5. **Re-run migration** - Delete v2 collections, start fresh

## Testing Strategy

### Pre-Migration

1. **Count documents** in each v1 collection
2. **Backup Firestore** (export to JSON via Firebase Console)
3. **Test scripts** in dry-run mode
4. **Review logs** for any warnings

### During Migration

1. **Monitor console** for errors
2. **Check Firestore console** for new documents appearing
3. **Verify document structure** matches expected schema

### Post-Migration

1. **Count documents** in v2 collections (should match v1)
2. **Spot-check data** - compare v1 vs v2 documents
3. **Test v2 UI** - view lists, create contracts, view details
4. **Compare financial totals** - v1 vs v2 should match

## Migration Scripts

### 1. migrateClients.ts

```typescript
export async function migrateClients(dryRun: boolean = true): Promise<MigrationResult>
```

### 2. createInitialEvents.ts

```typescript
export async function createEventsFromContracts(
  dryRun: boolean = true
): Promise<{ serviceEventMap: Map<string, string>, eventPlanningEventMap: Map<string, string> }>
```

### 3. migrateServiceContracts.ts

```typescript
export async function migrateServiceContracts(
  serviceEventMap: Map<string, string>,
  dryRun: boolean = true
): Promise<MigrationResult>
```

### 4. migrateEventPlanningContracts.ts

```typescript
export async function migrateEventPlanningContracts(
  eventPlanningEventMap: Map<string, string>,
  dryRun: boolean = true
): Promise<MigrationResult>
```

### 5. runMigration.ts

Orchestrator script that runs all migrations in order:

```typescript
export async function runFullMigration(dryRun: boolean = true): Promise<void>
```

## Expected Results

### Before Migration

- `clients`: N documents
- `service-contracts`: M documents
- `event-planning-contracts`: P documents
- `counterparties`: 0 documents
- `events`: 0 documents
- `service-provision-contracts`: 0 documents

### After Migration

- `clients`: N documents (unchanged)
- `service-contracts`: M documents (unchanged)
- `event-planning-contracts`: P documents (updated with eventId, counterpartyId)
- `counterparties`: N documents (migrated from clients)
- `events`: M + P documents (one per contract)
- `service-provision-contracts`: M documents (migrated from service-contracts)

## Post-Migration Tasks

1. **Update state initialization** - Initialize v2 state instead of v1
2. **Update navigation** - Point to v2 routes
3. **Archive v1 code** - Keep for reference, don't delete
4. **Monitor production** - Watch for errors, performance issues
5. **Plan v1 cleanup** - After stable period, can delete v1 collections

---

**Last Updated:** 2026-01-04
**Author:** Migration generated by Claude Code
