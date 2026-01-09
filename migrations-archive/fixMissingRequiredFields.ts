import { db } from '$lib/config/firebase';
import {
	collection,
	getDocs,
	doc,
	updateDoc,
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
 * Required fields and their default values for each counterparty type
 * Only fields that are required (not nullable/optional) need defaults
 */
const REQUIRED_FIELDS_BY_TYPE: Record<string, Record<string, string | number | string[]>> = {
	venue: {
		// venueName and venueAddress are required but might be empty strings, so we'll check for missing/null
		taxCode: 'N/A' // Required, non-empty string
	},
	'service-provider': {
		serviceType: 'N/A' // Required, non-empty string
	},
	performer: {
		stageName: 'N/A', // Required, non-empty string
		performerType: 'N/A' // Required, non-empty string
	},
	client: {
		clientType: 'individual' // Required enum
	},
	supplier: {
		companyName: 'N/A', // Required, non-empty string
		productCategories: ['N/A'] // Required, non-empty array
	}
};

/**
 * Fix missing required fields in counterparty documents
 * Sets default values for required fields that are missing
 *
 * @param dryRun - If true, log what would happen without writing to database
 * @returns Migration result with stats and errors
 */
export async function fixMissingRequiredFields(
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
				? '🔍 DRY RUN: Fixing missing required fields in counterparties...'
				: '🔄 Fixing missing required fields in counterparties...\n'
		);

		const counterpartiesRef = collection(db, 'counterparties');
		const snapshot = await getDocs(counterpartiesRef);

		result.total = snapshot.size;
		console.log(`Found ${result.total} counterparties\n`);

		for (const docSnap of snapshot.docs) {
			const data = docSnap.data();
			const docId = docSnap.id;
			const type = data.type as string;

			if (!type) {
				console.log(`⚠ ${docId}: Missing type, skipping`);
				result.skipped++;
				continue;
			}

			const requiredFields = REQUIRED_FIELDS_BY_TYPE[type] || {};
			const updates: Record<string, unknown> = {};
			let needsUpdate = false;

			// Check for missing required fields
			for (const [field, defaultValue] of Object.entries(requiredFields)) {
				const currentValue = data[field];

				// Check if field is missing, null, or undefined
				if (!(field in data) || currentValue === null || currentValue === undefined) {
					updates[field] = defaultValue;
					needsUpdate = true;
					console.log(
						`  ${docId} (${type}): Missing ${field} → ${JSON.stringify(defaultValue)}`
					);
				} else if (Array.isArray(defaultValue)) {
					// For array fields, check if it's an array and non-empty
					if (!Array.isArray(currentValue) || currentValue.length === 0) {
						updates[field] = defaultValue;
						needsUpdate = true;
						console.log(
							`  ${docId} (${type}): ${field} is ${!Array.isArray(currentValue) ? 'not an array' : 'empty'} → ${JSON.stringify(defaultValue)}`
						);
					}
				} else if (typeof defaultValue === 'string') {
					// For string fields, check if it's empty or whitespace
					if (typeof currentValue !== 'string' || currentValue.trim() === '') {
						updates[field] = defaultValue;
						needsUpdate = true;
						console.log(
							`  ${docId} (${type}): ${field} is ${typeof currentValue !== 'string' ? 'not a string' : 'empty'} → ${JSON.stringify(defaultValue)}`
						);
					}
				}
			}

			if (!needsUpdate) {
				result.skipped++;
				console.log(`✓ ${docId} (${type}): All required fields present`);
				continue;
			}

			updates.updatedAt = serverTimestamp();

			if (dryRun) {
				console.log(`[DRY RUN] Would update ${docId} (${type}):`, Object.keys(updates).join(', '));
				result.updated++;
			} else {
				try {
					const docRef = doc(db, 'counterparties', docId);
					await updateDoc(docRef, updates);
					console.log(`✓ Updated ${docId} (${type}):`, Object.keys(updates).join(', '));
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

