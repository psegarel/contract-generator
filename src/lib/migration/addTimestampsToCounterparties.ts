import { db } from './firebase-node';
import { collection, getDocs, doc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

/**
 * Migration result type
 */
export interface MigrationResult {
	total: number;
	updated: number;
	skipped: number;
	failed: number;
	errors: Array<{ id: string; error: string }>;
	duration: number;
}

/**
 * Add createdAt and updatedAt to counterparty documents that are missing them
 *
 * @param dryRun - If true, log what would happen without writing to database
 * @returns Migration result with stats and errors
 */
export async function addTimestampsToCounterparties(
	dryRun: boolean = true
): Promise<MigrationResult> {
	const startTime = Date.now();
	const result: MigrationResult = {
		total: 0,
		updated: 0,
		skipped: 0,
		failed: 0,
		errors: [],
		duration: 0
	};

	try {
		console.log(dryRun ? '🔍 DRY RUN: Checking counterparties...' : '🔄 Migrating counterparties...\n');

		const counterpartiesRef = collection(db, 'counterparties');
		const snapshot = await getDocs(counterpartiesRef);

		result.total = snapshot.size;
		console.log(`Found ${result.total} counterparties\n`);

		for (const docSnap of snapshot.docs) {
			const data = docSnap.data();
			const docId = docSnap.id;

			// Check if document is missing createdAt or updatedAt
			const hasCreatedAt = data.createdAt !== undefined && data.createdAt !== null;
			const hasUpdatedAt = data.updatedAt !== undefined && data.updatedAt !== null;

			if (hasCreatedAt && hasUpdatedAt) {
				result.skipped++;
				console.log(`✓ ${docId}: Already has timestamps`);
				continue;
			}

			// Prepare update: use serverTimestamp() for missing fields
			const updates: Record<string, unknown> = {};

			if (!hasCreatedAt) {
				updates.createdAt = serverTimestamp();
			}

			if (!hasUpdatedAt) {
				updates.updatedAt = serverTimestamp();
			}

			if (dryRun) {
				console.log(`[DRY RUN] Would update ${docId}:`, updates);
				result.updated++;
			} else {
				try {
					const docRef = doc(db, 'counterparties', docId);
					await updateDoc(docRef, updates);
					console.log(`✓ Updated ${docId}:`, Object.keys(updates).join(', '));
					result.updated++;
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : String(error);
					console.error(`✗ Failed to update ${docId}:`, errorMessage);
					result.errors.push({ id: docId, error: errorMessage });
					result.failed++;
				}
			}
		}

		result.duration = Date.now() - startTime;

		console.log('\n' + '='.repeat(50));
		console.log('Migration Summary:');
		console.log(`Total: ${result.total}`);
		console.log(`Updated: ${result.updated}`);
		console.log(`Skipped: ${result.skipped}`);
		console.log(`Failed: ${result.failed}`);
		console.log(`Duration: ${(result.duration / 1000).toFixed(2)}s`);
		if (result.errors.length > 0) {
			console.log('\nErrors:');
			result.errors.forEach(({ id, error }) => {
				console.log(`  - ${id}: ${error}`);
			});
		}
		console.log('='.repeat(50));

		return result;
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error('Migration failed:', errorMessage);
		result.errors.push({ id: 'migration', error: errorMessage });
		result.failed++;
		result.duration = Date.now() - startTime;
		return result;
	}
}






