import { db } from '$lib/config/firebase';
import { collection, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { VenueCounterparty } from '$lib/types/v2';
import type { MigrationResult } from './migrateClients';

/**
 * V1 Location type (from Firestore)
 */
interface V1Location {
	id: string;
	ownerUid: string;
	name: string;
	address: string;
	contactPerson?: string | null;
	contactEmail?: string | null;
	contactPhone?: string | null;
	createdAt?: unknown;
	updatedAt?: unknown;
}

/**
 * Transform V1 Location to V2 VenueCounterparty
 */
function transformLocation(v1Location: V1Location): Omit<VenueCounterparty, 'id'> {
	return {
		type: 'venue',

		// Common fields (from BaseCounterparty)
		name: v1Location.name,
		email: v1Location.contactEmail || null,
		phone: v1Location.contactPhone || null,
		address: v1Location.address || null,

		// Venue-specific fields
		venueName: v1Location.name,
		venueAddress: v1Location.address,
		ownerCompany: null,

		// Business & billing
		taxCode: '', // Required field - empty for migrated data
		bankName: null,
		bankAccountNumber: null,
		representativeName: v1Location.contactPerson || null,
		representativePosition: null,

		// Venue details
		venueCapacity: null,
		venueType: null,
		amenities: [],

		// Timestamps
		createdAt: serverTimestamp() as any,
		updatedAt: serverTimestamp() as any,
		ownerUid: v1Location.ownerUid,

		// Optional metadata
		notes: null
	};
}

/**
 * Migrate locations from v1 to v2 counterparties
 *
 * @param dryRun - If true, log what would happen without writing to database
 * @returns Migration result with stats and errors
 */
export async function migrateLocations(dryRun: boolean = true): Promise<MigrationResult> {
	const startTime = Date.now();
	const errors: Array<{ id: string; error: string }> = [];
	let successful = 0;

	console.log('\n=== Location Migration ===');
	console.log(`Mode: ${dryRun ? 'DRY RUN (no writes)' : 'LIVE (writing to database)'}`);
	console.log('Source: locations collection');
	console.log('Destination: counterparties collection (as VenueCounterparty)');
	console.log('Note: All locations migrated as type="venue"\n');

	try {
		// Fetch all locations from v1 collection
		const locationsSnapshot = await getDocs(collection(db, 'locations'));
		const total = locationsSnapshot.size;

		console.log(`Found ${total} locations to migrate\n`);

		if (total === 0) {
			console.log('No locations found. Migration complete.\n');
			return {
				total: 0,
				successful: 0,
				failed: 0,
				errors: [],
				duration: Date.now() - startTime
			};
		}

		// Process each location
		for (const [index, locationDoc] of locationsSnapshot.docs.entries()) {
			const locationId = locationDoc.id;

			try {
				const locationData = locationDoc.data() as Omit<V1Location, 'id'>;
				const v1Location: V1Location = { id: locationId, ...locationData };

				// Transform to v2 format
				const v2Counterparty = transformLocation(v1Location);

				if (dryRun) {
					// Log what would be created
					console.log(`[${index + 1}/${total}] Would migrate location "${v1Location.name}" (${locationId})`);
					console.log(`  → Type: venue`);
					console.log(`  → Address: ${v2Counterparty.address}`);
					console.log(`  → Contact: ${v2Counterparty.representativeName || 'none'}\n`);
				} else {
					// Write to v2 collection (preserve original ID)
					const counterpartyRef = doc(db, 'counterparties', locationId);
					await setDoc(counterpartyRef, v2Counterparty);

					console.log(`[${index + 1}/${total}] ✓ Migrated location "${v1Location.name}" (${locationId})`);
				}

				successful++;
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : String(error);
				errors.push({ id: locationId, error: errorMessage });
				console.error(`[${index + 1}/${total}] ✗ ERROR migrating location ${locationId}:`, errorMessage);
			}

			// Progress indicator every 10 documents
			if ((index + 1) % 10 === 0 && index + 1 < total) {
				console.log(`--- Progress: ${index + 1}/${total} (${Math.round(((index + 1) / total) * 100)}%) ---\n`);
			}
		}

		// Summary
		const duration = Date.now() - startTime;
		const failed = errors.length;

		console.log('\n=== Migration Summary ===');
		console.log(`Total locations: ${total}`);
		console.log(`Successful: ${successful}`);
		console.log(`Failed: ${failed}`);
		console.log(`Duration: ${(duration / 1000).toFixed(2)}s`);

		if (failed > 0) {
			console.log('\nErrors:');
			errors.forEach(({ id, error }) => {
				console.log(`  - ${id}: ${error}`);
			});
		}

		if (dryRun) {
			console.log('\n⚠️  DRY RUN COMPLETE - No data was written to the database');
		} else {
			console.log('\n✓ MIGRATION COMPLETE');
			console.log('\nPost-migration tasks:');
			console.log('  - Review migrated counterparties in Firestore');
			console.log('  - Locations migrated as type="venue"');
		}

		console.log('========================\n');

		return {
			total,
			successful,
			failed,
			errors,
			duration
		};
	} catch (error) {
		console.error('FATAL ERROR during location migration:', error);
		throw error;
	}
}
