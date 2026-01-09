import { db } from '$lib/config/firebase';
import {
	collection,
	getDocs,
	doc,
	updateDoc,
	query,
	where,
	serverTimestamp
} from 'firebase/firestore';

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
 * Fix null values in counterparty documents
 * - Convert null arrays to empty arrays []
 * - Set null/empty serviceType to "N/A"
 * - Check all counterparty types for null array issues
 *
 * @param dryRun - If true, log what would happen without writing to database
 * @returns Migration result with stats and errors
 */
export async function fixCounterpartyNullValues(
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
		console.log(
			dryRun
				? '🔍 DRY RUN: Fixing null values in counterparties...'
				: '🔄 Fixing null values in counterparties...\n'
		);

		const counterpartiesRef = collection(db, 'counterparties');
		const snapshot = await getDocs(counterpartiesRef);

		result.total = snapshot.size;
		console.log(`Found ${result.total} counterparties\n`);

		for (const docSnap of snapshot.docs) {
			const data = docSnap.data();
			const docId = docSnap.id;
			const updates: Record<string, unknown> = {};
			let needsUpdate = false;

			// Debug: Log service provider data structure
			if (data.type === 'service-provider') {
				console.log(`\nChecking service provider ${docId}:`);
				console.log(`  serviceType: ${JSON.stringify(data.serviceType)} (type: ${typeof data.serviceType})`);
				console.log(`  typicalDeliverables: ${JSON.stringify(data.typicalDeliverables)} (type: ${Array.isArray(data.typicalDeliverables) ? 'array' : typeof data.typicalDeliverables})`);
				console.log(`  equipmentProvided: ${JSON.stringify(data.equipmentProvided)} (type: ${Array.isArray(data.equipmentProvided) ? 'array' : typeof data.equipmentProvided})`);
			}

			// Check for null arrays (all types) - check both null and undefined
			if (data.typicalDeliverables === null || data.typicalDeliverables === undefined) {
				updates.typicalDeliverables = [];
				needsUpdate = true;
				console.log(`  ${docId}: typicalDeliverables is ${data.typicalDeliverables === null ? 'null' : 'undefined'} → []`);
			}

			if (data.equipmentProvided === null || data.equipmentProvided === undefined) {
				updates.equipmentProvided = [];
				needsUpdate = true;
				console.log(`  ${docId}: equipmentProvided is ${data.equipmentProvided === null ? 'null' : 'undefined'} → []`);
			}

			// Check for null arrays in other types
			if (data.amenities === null || data.amenities === undefined) {
				updates.amenities = [];
				needsUpdate = true;
				console.log(`  ${docId}: amenities is ${data.amenities === null ? 'null' : 'undefined'} → []`);
			}

			if (data.productCategories === null || data.productCategories === undefined) {
				updates.productCategories = [];
				needsUpdate = true;
				console.log(`  ${docId}: productCategories is ${data.productCategories === null ? 'null' : 'undefined'} → []`);
			}

			if (data.deliveryOptions === null || data.deliveryOptions === undefined) {
				updates.deliveryOptions = [];
				needsUpdate = true;
				console.log(`  ${docId}: deliveryOptions is ${data.deliveryOptions === null ? 'null' : 'undefined'} → []`);
			}

			// Check for null/empty serviceType (service-provider only)
			if (data.type === 'service-provider') {
				const serviceTypeValue = data.serviceType;
				if (
					serviceTypeValue === null ||
					serviceTypeValue === undefined ||
					(typeof serviceTypeValue === 'string' && serviceTypeValue.trim() === '')
				) {
					updates.serviceType = 'N/A';
					needsUpdate = true;
					console.log(
						`  ${docId}: serviceType is ${serviceTypeValue === null ? 'null' : serviceTypeValue === undefined ? 'undefined' : 'empty'} → "N/A"`
					);
				}
			}

			if (!needsUpdate) {
				result.skipped++;
				console.log(`✓ ${docId}: No null values found`);
				continue;
			}

			// Add updatedAt timestamp
			updates.updatedAt = serverTimestamp();

			if (dryRun) {
				console.log(`[DRY RUN] Would update ${docId}:`, Object.keys(updates).join(', '));
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

