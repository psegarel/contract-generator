/**
 * V1 → V2 Migration Module
 *
 * This module contains scripts to migrate existing v1 data to the new v2 architecture.
 *
 * ## Migration Order (CRITICAL):
 * 1. migrateClients - clients → counterparties (client type)
 * 2. migrateLocations - locations → counterparties (venue type)
 * 3. createInitialEvents - contracts → events
 * 4. migrateServiceContracts - service-contracts → service-provision-contracts
 * 5. migrateEventPlanningContracts - update event-planning-contracts with new fields
 *
 * ## Usage:
 * ```typescript
 * import { runFullMigration } from '$lib/migration';
 *
 * // Dry run (no database writes)
 * await runFullMigration(true);
 *
 * // Live execution (writes to database)
 * await runFullMigration(false);
 * ```
 *
 * ## Command Line:
 * ```bash
 * # Dry run
 * npx tsx src/lib/migration/runMigration.ts
 *
 * # Live execution
 * npx tsx src/lib/migration/runMigration.ts --live
 * ```
 */

export { migrateClients } from './migrateClients';
export { migrateLocations } from './migrateLocations';
export { createInitialEvents } from './createInitialEvents';
export { migrateServiceContracts } from './migrateServiceContracts';
export { migrateEventPlanningContracts } from './migrateEventPlanningContracts';
export { runFullMigration } from './runMigration';
export { addTimestampsToCounterparties } from './addTimestampsToCounterparties';
export { removeInvalidCounterpartyFields } from './removeInvalidCounterpartyFields';
export { fixMissingRequiredFields } from './fixMissingRequiredFields';
export { cleanCounterpartyData } from './cleanCounterpartyData';

export type { MigrationResult } from './migrateClients';
