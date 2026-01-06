import { db } from '$lib/config/firebase';
import {
	collection,
	getDocs,
	doc,
	updateDoc,
	serverTimestamp,
	deleteField
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
 * Valid fields for each counterparty type (from schemas)
 */
const VALID_FIELDS_BY_TYPE: Record<string, Set<string>> = {
	client: new Set([
		'type',
		'name',
		'email',
		'phone',
		'address',
		'ownerUid',
		'notes',
		'createdAt',
		'updatedAt',
		'clientType',
		'companyName',
		'representativeName',
		'representativePosition',
		'idDocument',
		'taxId',
		'bankName',
		'bankAccountNumber'
	]),
	'service-provider': new Set([
		'type',
		'name',
		'email',
		'phone',
		'address',
		'ownerUid',
		'notes',
		'createdAt',
		'updatedAt',
		'serviceType',
		'companyName',
		'typicalDeliverables',
		'equipmentProvided',
		'businessLicense',
		'insuranceInfo'
	]),
	venue: new Set([
		'type',
		'name',
		'email',
		'phone',
		'address',
		'ownerUid',
		'notes',
		'createdAt',
		'updatedAt',
		'venueName',
		'venueAddress',
		'ownerCompany',
		'taxCode',
		'bankName',
		'bankAccountNumber',
		'representativeName',
		'representativePosition',
		'venueCapacity',
		'venueType',
		'amenities'
	]),
	supplier: new Set([
		'type',
		'name',
		'email',
		'phone',
		'address',
		'ownerUid',
		'notes',
		'createdAt',
		'updatedAt',
		'companyName',
		'productCategories',
		'paymentTerms',
		'deliveryOptions'
	]),
	performer: new Set([
		'type',
		'name',
		'email',
		'phone',
		'address',
		'ownerUid',
		'notes',
		'createdAt',
		'updatedAt',
		'stageName',
		'performerType',
		'genre',
		'technicalRider',
		'minPerformanceDuration',
		'travelRequirements',
		'agentName',
		'agentContact'
	])
};

/**
 * Get all fields that should be removed for a given type
 * Returns all fields in the document that are not in the valid fields set
 */
function getInvalidFields(data: Record<string, unknown>, type: string): string[] {
	const validFields = VALID_FIELDS_BY_TYPE[type] || new Set();
	const invalidFields: string[] = [];

	for (const field in data) {
		// Skip Firestore metadata fields
		if (field === '__name__' || field === '__type__') {
			continue;
		}

		// If field is not in valid set, it's invalid
		if (!validFields.has(field)) {
			invalidFields.push(field);
		}
	}

	return invalidFields;
}

/**
 * Remove invalid fields from counterparty documents
 * Removes type-specific fields that don't belong to each counterparty's type
 *
 * @param dryRun - If true, log what would happen without writing to database
 * @returns Migration result with stats and errors
 */
export async function removeInvalidCounterpartyFields(
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
				? '🔍 DRY RUN: Removing invalid fields from counterparties...'
				: '🔄 Removing invalid fields from counterparties...\n'
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

			// Get all invalid fields for this type
			const fieldsToRemove = getInvalidFields(data, type);

			if (fieldsToRemove.length === 0) {
				result.skipped++;
				console.log(`✓ ${docId} (${type}): No invalid fields found`);
				continue;
			}

			// Prepare updates: set invalid fields to FieldValue.delete()
			const updates: Record<string, unknown> = {};
			for (const field of fieldsToRemove) {
				// Use null as a marker - we'll use deleteField() in Firestore
				// Actually, we need to use deleteField from firebase/firestore
				updates[field] = null; // We'll handle this differently
			}
			updates.updatedAt = serverTimestamp();

			if (dryRun) {
				console.log(
					`[DRY RUN] Would remove from ${docId} (${type}):`,
					fieldsToRemove.join(', ')
				);
				result.updated++;
			} else {
				try {
					const docRef = doc(db, 'counterparties', docId);
					const finalUpdates: Record<string, unknown> = {};
					for (const field of fieldsToRemove) {
						finalUpdates[field] = deleteField();
					}
					finalUpdates.updatedAt = serverTimestamp();

					await updateDoc(docRef, finalUpdates);
					console.log(`✓ Removed from ${docId} (${type}):`, fieldsToRemove.join(', '));
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

