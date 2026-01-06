import { db } from '$lib/config/firebase';
import {
	collection,
	getDocs,
	doc,
	updateDoc,
	serverTimestamp,
	deleteField
} from 'firebase/firestore';
import {
	venueCounterpartySchema,
	performerCounterpartySchema,
	serviceProviderCounterpartySchema,
	clientCounterpartySchema,
	supplierCounterpartySchema
} from '$lib/schemas/v2';
import type { z } from 'zod';

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
 * Schema map by type
 */
const SCHEMAS_BY_TYPE: Record<string, z.ZodSchema> = {
	venue: venueCounterpartySchema,
	performer: performerCounterpartySchema,
	'service-provider': serviceProviderCounterpartySchema,
	client: clientCounterpartySchema,
	supplier: supplierCounterpartySchema
};

/**
 * Get all field names from a Zod object schema
 * Handles nested schemas (baseCounterpartySchema.extend()) and effects (.strict())
 */
function getSchemaFields(schema: z.ZodSchema): Set<string> {
	const fields = new Set<string>();
	
	function traverse(s: z.ZodTypeAny): void {
		const def = s._def as any;
		const typeName = def.typeName;
		
		if (typeName === 'ZodObject') {
			const shape = def.shape();
			for (const key of Object.keys(shape)) {
				fields.add(key);
			}
		} else if (typeName === 'ZodEffects') {
			// Handle .strict(), .refine(), etc. - traverse the inner schema
			traverse(def.schema);
		} else if (typeName === 'ZodDefault') {
			traverse(def.innerType);
		} else if (typeName === 'ZodNullable' || typeName === 'ZodOptional') {
			traverse(def.innerType);
		} else if (typeName === 'ZodLazy') {
			// Handle lazy schemas
			traverse(def.getter());
		}
	}
	
	traverse(schema);
	return fields;
}

/**
 * Clean counterparty data by:
 * 1. Validating against the correct schema for its type
 * 2. Removing all fields not in the schema
 * 3. Adding default values for missing required fields
 * 4. Ensuring arrays are arrays (not null/undefined)
 * 5. Ensuring required strings are non-empty
 *
 * @param dryRun - If true, log what would happen without writing to database
 * @returns Migration result with stats and errors
 */
export async function cleanCounterpartyData(
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
				? '🔍 DRY RUN: Cleaning counterparty data...'
				: '🔄 Cleaning counterparty data...\n'
		);

		const counterpartiesRef = collection(db, 'counterparties');
		const snapshot = await getDocs(counterpartiesRef);

		result.total = snapshot.size;
		console.log(`Found ${result.total} counterparties\n`);

		for (const docSnap of snapshot.docs) {
			const data = docSnap.data();
			const docId = docSnap.id;
			const type = (data.type as string)?.trim()?.toLowerCase();

			if (!type || !SCHEMAS_BY_TYPE[type]) {
				console.log(`⚠ ${docId}: Invalid or missing type "${data.type}", skipping`);
				result.skipped++;
				continue;
			}

			const schema = SCHEMAS_BY_TYPE[type];

			// Step 1: Validate against schema
			const validationResult = schema.safeParse(data);

			if (validationResult.success) {
				// Data is valid - use the validated data to determine valid fields
				const validFields = new Set(Object.keys(validationResult.data as Record<string, unknown>));
				
				// Check for extra fields (shouldn't happen with strict, but verify)
				// Data is valid - check for extra fields (shouldn't happen with strict, but verify)
				const fieldsToRemove: string[] = [];

				for (const field in data) {
					if (field === '__name__' || field === '__type__') continue;
					if (!validFields.has(field)) {
						fieldsToRemove.push(field);
					}
				}

				if (fieldsToRemove.length === 0) {
					result.skipped++;
					console.log(`✓ ${docId} (${type}): Already clean`);
					continue;
				}

				// Remove extra fields
				const updates: Record<string, unknown> = {};
				for (const field of fieldsToRemove) {
					updates[field] = deleteField();
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
						await updateDoc(docRef, updates);
						console.log(`✓ Cleaned ${docId} (${type}): Removed ${fieldsToRemove.join(', ')}`);
						result.updated++;
					} catch (error) {
						const errorMessage = error instanceof Error ? error.message : String(error);
						console.error(`✗ Failed to update ${docId}:`, errorMessage);
						result.errors.push({ id: docId, error: errorMessage });
						result.failed++;
					}
				}
			} else {
				// Data is invalid - fix it
				console.log(`\n🔧 ${docId} (${type}): Needs cleaning`);
				
				// Get valid fields from schema
				const validFields = getSchemaFields(schema);
				
				// If we can't extract fields, use a different approach: remove fields mentioned in errors
				if (validFields.size === 0) {
					console.log(`  ⚠ Could not extract fields from schema, using error-based approach`);
				}
				
				const fieldsToRemove: string[] = [];
				const fieldsToAdd: Record<string, unknown> = {};

				// Step 1: Remove all fields not in schema (or mentioned in unrecognized_keys errors)
				const errorIssues = validationResult.error.issues || [];
				const unrecognizedKeys = new Set<string>();
				
				for (const error of errorIssues) {
					if (error.code === 'unrecognized_keys' && error.keys) {
						for (const key of error.keys) {
							unrecognizedKeys.add(key);
						}
					}
				}
				
				// Remove unrecognized keys
				for (const field of unrecognizedKeys) {
					fieldsToRemove.push(field);
					console.log(`  - Remove invalid field: ${field}`);
				}
				
				// Also remove fields not in validFields if we have them
				if (validFields.size > 0) {
					for (const field in data) {
						if (field === '__name__' || field === '__type__') continue;
						if (!validFields.has(field) && !fieldsToRemove.includes(field)) {
							fieldsToRemove.push(field);
							console.log(`  - Remove field not in schema: ${field}`);
						}
					}
				}

				// Step 2: Analyze validation errors to fix missing/invalid fields
				for (const error of errorIssues) {
					const fieldPath = error.path[0] as string;
					
					if (error.code === 'unrecognized_keys') {
						// Already handled above
						continue;
					} else if (error.code === 'invalid_type') {
						const invalidTypeError = error as z.ZodIssue & { received: string; expected: string };
						if (invalidTypeError.received === 'undefined' || invalidTypeError.received === 'null') {
							// Missing required field
							if (invalidTypeError.expected === 'array') {
								fieldsToAdd[fieldPath] = [];
								console.log(`  - Add missing array: ${fieldPath} = []`);
							} else if (invalidTypeError.expected === 'string') {
								// taxCode is optional, so we shouldn't add it if missing
								// Only add defaults for required string fields
								fieldsToAdd[fieldPath] = 'N/A';
								console.log(`  - Add missing string: ${fieldPath} = "N/A"`);
							} else if (invalidTypeError.expected === 'enum') {
								// Get first enum value as default
								const enumValues = (invalidTypeError as any).options || [];
								if (enumValues.length > 0) {
									fieldsToAdd[fieldPath] = enumValues[0];
									console.log(`  - Add missing enum: ${fieldPath} = "${enumValues[0]}"`);
								}
							}
						} else if (invalidTypeError.expected === 'array' && !Array.isArray(data[fieldPath])) {
							fieldsToAdd[fieldPath] = [];
							console.log(`  - Fix non-array: ${fieldPath} = []`);
						}
					} else if (error.code === 'too_small') {
						// Empty string or array
						if (error.minimum === 1) {
							if (typeof data[fieldPath] === 'string') {
								// taxCode is optional, so empty string is valid - don't fix it
								// Only fix required string fields
								fieldsToAdd[fieldPath] = 'N/A';
								console.log(`  - Fix empty string: ${fieldPath} = "N/A"`);
							} else if (Array.isArray(data[fieldPath])) {
								fieldsToAdd[fieldPath] = ['N/A'];
								console.log(`  - Fix empty array: ${fieldPath} = ["N/A"]`);
							}
						}
					}
				}

				// Step 3: Handle special cases for enums
				if (type === 'client' && (!data.clientType || !['individual', 'company'].includes(data.clientType))) {
					fieldsToAdd.clientType = 'individual';
					console.log(`  - Fix clientType: clientType = "individual"`);
				}

				if (fieldsToRemove.length === 0 && Object.keys(fieldsToAdd).length === 0) {
					console.log(`  ⚠ No fixes identified`);
					result.skipped++;
					continue;
				}

				// Prepare updates
				const updates: Record<string, unknown> = {};
				for (const field of fieldsToRemove) {
					updates[field] = deleteField();
				}
				for (const [field, value] of Object.entries(fieldsToAdd)) {
					updates[field] = value;
				}
				updates.updatedAt = serverTimestamp();

				if (dryRun) {
					console.log(`[DRY RUN] Would update ${docId} (${type}):`);
					if (fieldsToRemove.length > 0) {
						console.log(`  Remove: ${fieldsToRemove.join(', ')}`);
					}
					if (Object.keys(fieldsToAdd).length > 0) {
						console.log(`  Add: ${Object.entries(fieldsToAdd).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(', ')}`);
					}
					result.updated++;
				} else {
					try {
						const docRef = doc(db, 'counterparties', docId);
						await updateDoc(docRef, updates);
						
						// Re-validate after update
						const updatedData = { ...data };
						for (const field of fieldsToRemove) {
							delete updatedData[field];
						}
						Object.assign(updatedData, fieldsToAdd);
						
						const revalidation = schema.safeParse(updatedData);
						if (revalidation.success) {
							console.log(`✓ Cleaned ${docId} (${type}): Now valid`);
							result.updated++;
						} else {
							console.error(`⚠ ${docId} (${type}): Still invalid after update`);
							const revalidationIssues = revalidation.error.issues || [];
							console.error(`  Errors:`, revalidationIssues.map(e => `${e.path.join('.')}: ${e.message}`).join(', '));
							result.errors.push({ 
								id: docId, 
								error: `Still invalid: ${revalidationIssues.map(e => e.message).join(', ')}` 
							});
							result.failed++;
						}
					} catch (error) {
						const errorMessage = error instanceof Error ? error.message : String(error);
						console.error(`✗ Failed to update ${docId}:`, errorMessage);
						result.errors.push({ id: docId, error: errorMessage });
						result.failed++;
					}
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
