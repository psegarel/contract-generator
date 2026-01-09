# Database Migration History

**Purpose:** This directory contains historical database migration scripts that have already been run. These scripts are archived for reference and should not be run again unless explicitly needed for rollback or testing purposes.

**Status:** All migrations in this directory have been completed on the production database.

---

## Completed Migrations

### 1. Add Timestamps to Counterparties
**Script:** `addTimestampsToCounterparties.ts` / `addTimestampsToCounterpartiesBrowser.ts`
**Date Completed:** ~2024-12-XX
**Status:** ✅ Completed
**Description:** Added `createdAt` and `updatedAt` timestamp fields to all counterparty documents in Firestore.

**Impact:** All counterparties now have proper timestamp tracking for auditing and sorting.

---

### 2. Clean Counterparty Data
**Script:** `cleanCounterpartyData.ts`
**Date Completed:** ~2025-01-08
**Status:** ✅ Completed
**Description:** Cleaned up invalid and extraneous fields in counterparty documents to conform to the v2 schema.

**Changes:**
- Removed invalid fields that don't exist in schema
- Added missing required fields with default values
- Fixed non-array fields that should be arrays
- Fixed empty strings and arrays with proper defaults

**Impact:** All counterparties now validate against the strict v2 Zod schemas.

---

### 3. Fix Counterparty ID Issues
**Script:** `fixCounterpartyId.ts`
**Date Completed:** ~2025-01-08
**Status:** ✅ Completed
**Description:** Fixed counterparty documents that had invalid or duplicate ID values.

**Impact:** Cleaned up data integrity issues in counterparty collection.

---

### 4. Fix Counterparty Names
**Script:** `fixCounterpartyNames.ts`
**Date Completed:** ~2024-12-XX
**Status:** ✅ Completed
**Description:** Normalized and fixed counterparty names (trimming whitespace, fixing capitalization, removing duplicates).

**Impact:** Improved data quality and search functionality.

---

### 5. Fix Counterparty Null Values
**Script:** `fixCounterpartyNullValues.ts`
**Date Completed:** ~2025-01-08
**Status:** ✅ Completed
**Description:** Replaced null values in counterparty documents with appropriate defaults (empty strings, empty arrays).

**Impact:** Eliminated null pointer exceptions and validation errors.

---

### 6. Fix Missing Required Fields
**Script:** `fixMissingRequiredFields.ts`
**Date Completed:** ~2025-01-08
**Status:** ✅ Completed
**Description:** Added missing required fields to counterparty documents with sensible defaults.

**Impact:** All counterparties now have complete data structures.

---

### 7. Remove Invalid Counterparty Fields
**Script:** `removeInvalidCounterpartyFields.ts`
**Date Completed:** ~2025-01-08
**Status:** ✅ Completed
**Description:** Removed fields from counterparty documents that don't exist in the schema definition.

**Impact:** Cleaned up legacy fields and ensured schema compliance.

---

### 8. Migrate Clients to Counterparties
**Script:** `migrateClients.ts`
**Date Completed:** ~2024-12-XX
**Status:** ✅ Completed
**Description:** Migrated data from legacy `clients` collection to new `counterparties` collection with type discrimination.

**Changes:**
- Copied client data to counterparties collection
- Set type to 'client' for all migrated records
- Defaulted clientType to 'individual' (requires manual review)
- Preserved all original fields

**Impact:** Successfully migrated all clients to the new v2 architecture.

**Post-Migration Tasks:**
- ✅ Review migrated counterparties in Firestore
- ⚠️ Update clientType to "company" for event-planning clients if needed (manual task)

---

### 9. Migrate Event Planning Contracts
**Script:** `migrateEventPlanningContracts.ts`
**Date Completed:** ~2024-12-XX
**Status:** ✅ Completed
**Description:** Migrated event planning contracts from v1 to v2 schema structure.

**Changes:**
- Updated field names to match v2 schema
- Added new required fields
- Migrated nested data structures
- Preserved contract numbers and dates

**Impact:** All event planning contracts now use v2 schema.

---

### 10. Migrate Service Contracts
**Script:** `migrateServiceContracts.ts`
**Date Completed:** ~2024-12-XX
**Status:** ✅ Completed
**Description:** Migrated service provision contracts from v1 to v2 schema structure.

**Changes:**
- Updated field names to match v2 schema
- Calculated and added derived fields
- Preserved all financial data
- Migrated client information

**Impact:** All service contracts now use v2 schema.

---

### 11. Migrate Locations
**Script:** `migrateLocations.ts`
**Date Completed:** ~2024-12-XX
**Status:** ✅ Completed
**Description:** Migrated location/venue data to updated schema.

**Impact:** Location data conforms to current schema requirements.

---

### 12. Create Initial Events
**Script:** `createInitialEvents.ts`
**Date Completed:** ~2024-12-XX
**Status:** ✅ Completed
**Description:** Created initial event records from existing contract data.

**Changes:**
- Extracted event information from contracts
- Created event documents in events collection
- Linked contracts to events via eventId

**Impact:** Established event-centric data model for contract management.

---

## Migration Infrastructure

### Supporting Files

**`firebase-node.ts`**
Node.js Firebase configuration for running migrations via CLI.

**`index.ts`**
Migration index/exports file.

**`runMigration.ts`**
CLI utility for running migrations with dry-run support.

**`v2-migration-plan.md`**
Detailed migration plan and strategy documentation for v1 → v2 schema migration.

---

## How to Use These Scripts

### ⚠️ **WARNING: DO NOT run these scripts on production unless you know what you're doing!**

These migrations have already been completed. They are archived for:
1. **Reference** - Understanding how data was migrated
2. **Rollback** - In case we need to reverse a migration
3. **Testing** - Running against test databases
4. **Documentation** - Historical record of data transformations

### If You Need to Run a Migration:

1. **Copy the script** from `migrations-archive/` to a temporary location
2. **Review the code** thoroughly to understand what it does
3. **Test on a development database** first
4. **Use dry-run mode** to preview changes
5. **Backup your database** before running live
6. **Document the run** and results
7. **Move script back** to archive after completion

### Example (dry-run):
```bash
# Copy script to temp location
cp migrations-archive/migrateClients.ts temp/

# Run in dry-run mode (no database writes)
node temp/migrateClients.ts --dry-run

# If everything looks good, run live
node temp/migrateClients.ts

# Document and archive
echo "Re-ran migration on YYYY-MM-DD - Reason: ..." >> migrations-archive/MIGRATION_LOG.md
```

---

## Migration Best Practices

Based on our experience with these migrations:

1. **Always use dry-run mode first** - Preview changes before writing
2. **Validate data with Zod** - Use schemas to catch issues early
3. **Log everything** - Detailed logs help debug issues
4. **Batch processing** - Process large collections in chunks
5. **Progress tracking** - Show progress for long-running migrations
6. **Error handling** - Continue on error, log failures, show summary
7. **Backup first** - Always backup before running migrations
8. **Test thoroughly** - Use development databases for testing

---

## Future Migrations

If you need to create a new migration:

1. **Create in `/scripts/migrations/`** (not in `/src/lib/`)
2. **Use TypeScript** with proper types
3. **Include dry-run mode** for safety
4. **Add progress logging** for visibility
5. **Validate with Zod** before and after
6. **Document in this log** after completion
7. **Archive the script** after running

---

## Questions?

If you have questions about these migrations or need to run one:
1. Review the script code and comments
2. Check this log for context
3. Test on development database first
4. Consult with team if uncertain

---

**Last Updated:** 2026-01-09
**Updated By:** Claude Code (Codebase Cleanup Task 2.2)
