#!/usr/bin/env tsx
/**
 * Script to add createdAt and updatedAt timestamps to counterparty documents
 * that are missing them.
 *
 * Usage:
 *   # Dry run (check what would be updated)
 *   npx tsx scripts/add-timestamps-to-counterparties.ts
 *
 *   # Live execution (actually update documents)
 *   npx tsx scripts/add-timestamps-to-counterparties.ts --live
 */

import { addTimestampsToCounterparties } from '../src/lib/migration/addTimestampsToCounterparties';

const isLive = process.argv.includes('--live');

async function main() {
	console.log('='.repeat(50));
	console.log('Add Timestamps to Counterparties Migration');
	console.log('='.repeat(50));
	console.log(`Mode: ${isLive ? 'LIVE (will update database)' : 'DRY RUN (no changes)'}\n`);

	if (!isLive) {
		console.log('⚠️  This is a DRY RUN. No changes will be made.');
		console.log('   Run with --live flag to actually update documents.\n');
	}

	const result = await addTimestampsToCounterparties(!isLive);

	if (!isLive && result.updated > 0) {
		console.log('\n💡 To apply these changes, run:');
		console.log('   npx tsx scripts/add-timestamps-to-counterparties.ts --live\n');
	}

	process.exit(result.failed > 0 ? 1 : 0);
}

main().catch((error) => {
	console.error('Fatal error:', error);
	process.exit(1);
});




