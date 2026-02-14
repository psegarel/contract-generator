import {
	collection,
	getDocs,
	updateDoc,
	deleteDoc,
	doc,
	serverTimestamp
} from 'firebase/firestore';
import { db } from '$lib/config/firebase';

const COLLECTION_NAME = 'counterparties';

export interface MigrationResult {
	migrated: number;
	deleted: number;
	skipped: number;
	errors: string[];
	logs: string[];
	dryRun: boolean;
}

/**
 * Migrate counterparties from old 5-type model to new 2-tier model.
 *
 * Old types:
 * - client → client (unchanged)
 * - service-provider → contractor with contractorType: 'service-provider'
 * - performer → contractor with contractorType: 'performer'
 * - venue → deleted (or converted to client with clientType: 'company')
 * - supplier → deleted
 *
 * Run this once after deploying the new schema.
 */
export async function migrateCounterpartyTypes(
	options: {
		deleteVenueAndSupplier?: boolean;
		convertVenuesToClients?: boolean;
		dryRun?: boolean;
	} = {}
): Promise<MigrationResult> {
	const {
		deleteVenueAndSupplier = false,
		convertVenuesToClients = true,
		dryRun = false
	} = options;

	const prefix = dryRun ? '[DRY RUN] ' : '';

	const result: MigrationResult = {
		migrated: 0,
		deleted: 0,
		skipped: 0,
		errors: [],
		logs: [],
		dryRun
	};

	function log(message: string) {
		const entry = `${prefix}${message}`;
		result.logs.push(entry);
		console.log(entry);
	}

	log(`Starting counterparty type migration...`);

	const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
	log(`Found ${querySnapshot.docs.length} counterparties to process`);

	for (const docSnap of querySnapshot.docs) {
		const data = docSnap.data();
		const docRef = doc(db, COLLECTION_NAME, docSnap.id);

		try {
			switch (data.type) {
				case 'client':
					result.skipped++;
					log(`Skip client "${data.name}" (${docSnap.id}) - already correct type`);
					break;

				case 'contractor':
					result.skipped++;
					log(`Skip contractor "${data.name}" (${docSnap.id}) - already migrated`);
					break;

				case 'service-provider':
					if (!dryRun) {
						await updateDoc(docRef, {
							type: 'contractor',
							contractorType: 'service-provider',
							updatedAt: serverTimestamp()
						});
					}
					result.migrated++;
					log(
						`Migrate service-provider "${data.name}" (${docSnap.id}) → contractor/service-provider`
					);
					break;

				case 'performer':
					if (!dryRun) {
						await updateDoc(docRef, {
							type: 'contractor',
							contractorType: 'performer',
							updatedAt: serverTimestamp()
						});
					}
					result.migrated++;
					log(`Migrate performer "${data.name}" (${docSnap.id}) → contractor/performer`);
					break;

				case 'venue':
					if (convertVenuesToClients) {
						if (!dryRun) {
							await updateDoc(docRef, {
								type: 'client',
								clientType: 'company',
								companyName: data.ownerCompany || data.venueName || null,
								idDocument: null,
								taxId: data.taxCode || null,
								updatedAt: serverTimestamp()
							});
						}
						result.migrated++;
						log(`Convert venue "${data.name}" (${docSnap.id}) → client/company`);
					} else if (deleteVenueAndSupplier) {
						if (!dryRun) {
							await deleteDoc(docRef);
						}
						result.deleted++;
						log(`Delete venue "${data.name}" (${docSnap.id})`);
					} else {
						result.skipped++;
						log(`Skip venue "${data.name}" (${docSnap.id}) - no action specified`);
					}
					break;

				case 'supplier':
					if (deleteVenueAndSupplier) {
						if (!dryRun) {
							await deleteDoc(docRef);
						}
						result.deleted++;
						log(`Delete supplier "${data.name}" (${docSnap.id})`);
					} else {
						result.skipped++;
						log(`Skip supplier "${data.name}" (${docSnap.id}) - no action specified`);
					}
					break;

				default:
					result.errors.push(`Unknown type "${data.type}" for doc ${docSnap.id}`);
					log(`ERROR: Unknown counterparty type "${data.type}" (${docSnap.id})`);
			}
		} catch (error) {
			const msg = `Error migrating ${docSnap.id}: ${(error as Error).message}`;
			result.errors.push(msg);
			log(`ERROR: ${msg}`);
		}
	}

	log(
		`Migration complete: ${result.migrated} migrated, ${result.deleted} deleted, ${result.skipped} skipped, ${result.errors.length} errors`
	);

	return result;
}
