import { migrateClients } from './migrateClients';
import { migrateLocations } from './migrateLocations';
import { createInitialEvents } from './createInitialEvents';
import { migrateServiceContracts } from './migrateServiceContracts';
import { migrateEventPlanningContracts } from './migrateEventPlanningContracts';

/**
 * Run complete v1 → v2 migration
 *
 * CRITICAL: Migrations must execute in this exact order:
 * 1. Clients → Counterparties (creates client counterparty entities)
 * 2. Locations → Counterparties (creates venue counterparty entities)
 * 3. Contracts → Events (creates event entities)
 * 4. Service Contracts → Service Provision Contracts (links to events + counterparties)
 * 5. Update Event Planning Contracts (adds event + counterparty links)
 *
 * @param dryRun - If true, log what would happen without writing to database
 */
export async function runFullMigration(dryRun: boolean = true): Promise<void> {
	console.log('\n╔════════════════════════════════════════╗');
	console.log('║   V1 → V2 MIGRATION ORCHESTRATOR      ║');
	console.log('╚════════════════════════════════════════╝');
	console.log(`\nMode: ${dryRun ? '🔍 DRY RUN' : '🚀 LIVE EXECUTION'}`);
	console.log(`Started: ${new Date().toISOString()}\n`);

	if (!dryRun) {
		console.log('⚠️  WARNING: You are about to modify the database!');
		console.log('⚠️  Make sure you have a backup before proceeding.\n');
	}

	const overallStartTime = Date.now();

	try {
		// ====================================================================
		// STEP 1: Migrate Clients → Counterparties
		// ====================================================================
		console.log('\n┌────────────────────────────────────────┐');
		console.log('│ STEP 1: Migrate Clients                │');
		console.log('└────────────────────────────────────────┘');

		const clientsResult = await migrateClients(dryRun);

		if (clientsResult.failed > 0) {
			console.error(
				`\n❌ Client migration had ${clientsResult.failed} failures. Review errors before continuing.`
			);
			if (!dryRun) {
				console.log('Stopping migration due to errors.');
				return;
			}
		}

		// ====================================================================
		// STEP 2: Migrate Locations → Counterparties
		// ====================================================================
		console.log('\n┌────────────────────────────────────────┐');
		console.log('│ STEP 2: Migrate Locations              │');
		console.log('└────────────────────────────────────────┘');

		const locationsResult = await migrateLocations(dryRun);

		if (locationsResult.failed > 0) {
			console.error(
				`\n❌ Location migration had ${locationsResult.failed} failures. Review errors before continuing.`
			);
			if (!dryRun) {
				console.log('Stopping migration due to errors.');
				return;
			}
		}

		// ====================================================================
		// STEP 3: Create Events from Contracts
		// ====================================================================
		console.log('\n┌────────────────────────────────────────┐');
		console.log('│ STEP 3: Create Events                  │');
		console.log('└────────────────────────────────────────┘');

		const {
			serviceEventMap,
			eventPlanningEventMap,
			serviceResult,
			eventPlanningResult
		} = await createInitialEvents(dryRun);

		const eventsFailedCount = serviceResult.failed + eventPlanningResult.failed;
		if (eventsFailedCount > 0) {
			console.error(
				`\n❌ Event creation had ${eventsFailedCount} failures. Review errors before continuing.`
			);
			if (!dryRun) {
				console.log('Stopping migration due to errors.');
				return;
			}
		}

		// ====================================================================
		// STEP 4: Migrate Service Contracts → Service Provision Contracts
		// ====================================================================
		console.log('\n┌────────────────────────────────────────┐');
		console.log('│ STEP 4: Migrate Service Contracts      │');
		console.log('└────────────────────────────────────────┘');

		const serviceContractsResult = await migrateServiceContracts(serviceEventMap, dryRun);

		if (serviceContractsResult.failed > 0) {
			console.error(
				`\n❌ Service contract migration had ${serviceContractsResult.failed} failures. Review errors before continuing.`
			);
			if (!dryRun) {
				console.log('Stopping migration due to errors.');
				return;
			}
		}

		// ====================================================================
		// STEP 5: Update Event Planning Contracts
		// ====================================================================
		console.log('\n┌────────────────────────────────────────┐');
		console.log('│ STEP 5: Update Event Planning Contracts│');
		console.log('└────────────────────────────────────────┘');

		const eventPlanningContractsResult = await migrateEventPlanningContracts(
			eventPlanningEventMap,
			dryRun
		);

		if (eventPlanningContractsResult.failed > 0) {
			console.error(
				`\n❌ Event planning contract migration had ${eventPlanningContractsResult.failed} failures.`
			);
		}

		// ====================================================================
		// FINAL SUMMARY
		// ====================================================================
		const overallDuration = Date.now() - overallStartTime;

		console.log('\n╔════════════════════════════════════════╗');
		console.log('║   MIGRATION COMPLETE                   ║');
		console.log('╚════════════════════════════════════════╝\n');

		console.log('📊 Summary:\n');

		console.log('Clients → Counterparties:');
		console.log(`  ✓ Migrated: ${clientsResult.successful}/${clientsResult.total}`);
		console.log(`  ✗ Failed: ${clientsResult.failed}`);

		console.log('\nLocations → Counterparties:');
		console.log(`  ✓ Migrated: ${locationsResult.successful}/${locationsResult.total}`);
		console.log(`  ✗ Failed: ${locationsResult.failed}`);

		console.log('\nContracts → Events:');
		console.log(`  ✓ Service events: ${serviceResult.successful}/${serviceResult.total}`);
		console.log(
			`  ✓ Event planning events: ${eventPlanningResult.successful}/${eventPlanningResult.total}`
		);
		console.log(`  ✗ Failed: ${eventsFailedCount}`);

		console.log('\nService Contracts → Service Provision Contracts:');
		console.log(
			`  ✓ Migrated: ${serviceContractsResult.successful}/${serviceContractsResult.total}`
		);
		console.log(`  ✗ Failed: ${serviceContractsResult.failed}`);

		console.log('\nEvent Planning Contracts (updated):');
		console.log(
			`  ✓ Updated: ${eventPlanningContractsResult.successful}/${eventPlanningContractsResult.total}`
		);
		console.log(`  ✗ Failed: ${eventPlanningContractsResult.failed}`);

		console.log(`\n⏱️  Total duration: ${(overallDuration / 1000).toFixed(2)}s`);
		console.log(`🕐 Completed: ${new Date().toISOString()}\n`);

		if (dryRun) {
			console.log('═══════════════════════════════════════════════════════');
			console.log('  ⚠️  DRY RUN COMPLETE');
			console.log('  No data was written to the database.');
			console.log('  Review the output above, then run with dryRun=false');
			console.log('═══════════════════════════════════════════════════════\n');
		} else {
			const totalFailed =
				clientsResult.failed +
				locationsResult.failed +
				eventsFailedCount +
				serviceContractsResult.failed +
				eventPlanningContractsResult.failed;

			if (totalFailed === 0) {
				console.log('═══════════════════════════════════════════════════════');
				console.log('  ✅ MIGRATION SUCCESSFUL');
				console.log('  All data migrated to v2 collections.');
				console.log('═══════════════════════════════════════════════════════');
				console.log('\n📋 Post-migration checklist:');
				console.log('  1. Review migrated data in Firestore console');
				console.log('  2. Update event-planning client to clientType="company" if needed');
				console.log('  3. Test v2 UI - create contracts, view lists');
				console.log('  4. Compare financial totals v1 vs v2');
				console.log('  5. Update app to use v2 routes and state\n');
			} else {
				console.log('═══════════════════════════════════════════════════════');
				console.log(`  ⚠️  MIGRATION COMPLETED WITH ${totalFailed} ERRORS`);
				console.log('  Review error logs above and fix failed documents.');
				console.log('═══════════════════════════════════════════════════════\n');
			}
		}
	} catch (error) {
		console.error('\n❌ FATAL ERROR during migration:', error);
		console.error('\nMigration aborted. Database may be in partial state.');
		console.error('Check error logs above for details.\n');
		throw error;
	}
}

// Allow running directly from command line (Node.js only)
// Usage: npx tsx src/lib/migration/runMigration.ts [--live]
if (typeof process !== 'undefined' && process.argv && import.meta.url === `file://${process.argv[1]}`) {
	const dryRun = !process.argv.includes('--live');

	runFullMigration(dryRun)
		.then(() => {
			process.exit(0);
		})
		.catch((error) => {
			console.error('Migration failed:', error);
			process.exit(1);
		});
}
