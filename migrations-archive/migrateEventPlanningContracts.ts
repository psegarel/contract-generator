import { db } from '$lib/config/firebase';
import {
	collection,
	getDocs,
	doc,
	updateDoc,
	getDoc,
	setDoc,
	serverTimestamp,
	type Timestamp
} from 'firebase/firestore';
import type { EventPlanningContractData } from '$lib/schemas/eventPlanningContract';
import type { ClientCounterparty } from '$lib/types/v2';
import type { MigrationResult } from './migrateClients';

/**
 * V1 Event Planning Contract (from Firestore)
 */
interface V1EventPlanningContract {
	id: string;
	type: 'event-planning';
	contractData: EventPlanningContractData;
	contractNumber: string;
	createdAt: Timestamp;
	ownerUid: string;
	locationId: string; // Client ID (becomes counterpartyId)
	paymentDirection: 'receivable' | 'payable';
	paymentStatus: 'unpaid' | 'paid';
	paidAt: Timestamp | null;
	paidBy: string | null;
}

/**
 * Create counterparty from event planning contract data
 */
async function createCounterpartyFromContractData(
	counterpartyId: string,
	contractData: EventPlanningContractData,
	ownerUid: string,
	dryRun: boolean
): Promise<string> {
	const counterpartyData: Omit<ClientCounterparty, 'id'> = {
		type: 'client',
		clientType: 'company',

		// Common fields
		name: contractData.clientCompany,
		email: null,
		phone: null,
		address: contractData.clientAddress || null,

		// Client-specific fields
		companyName: contractData.clientCompany,
		representativeName: contractData.clientRepresentativeName || null,
		representativePosition: contractData.clientRepresentativePosition || null,
		idDocument: null,
		taxId: contractData.clientTaxCode || null,
		bankName: null,
		bankAccountNumber: null,

		// Metadata
		createdAt: serverTimestamp() as any,
		updatedAt: serverTimestamp() as any,
		ownerUid,
		notes: 'Auto-created from event planning contract'
	};

	if (dryRun) {
		console.log(`    Would create counterparty from contract data:`);
		console.log(`      → Company: ${contractData.clientCompany}`);
		console.log(`      → Tax Code: ${contractData.clientTaxCode}`);
		console.log(`      → Representative: ${contractData.clientRepresentativeName}\n`);
	} else {
		const counterpartyRef = doc(db, 'counterparties', counterpartyId);
		await setDoc(counterpartyRef, counterpartyData);
		console.log(`    ✓ Created counterparty: ${contractData.clientCompany}`);
	}

	return contractData.clientCompany;
}

/**
 * Get counterparty name from counterparties collection, or create if missing
 */
async function getOrCreateCounterparty(
	counterpartyId: string,
	contractData: EventPlanningContractData,
	ownerUid: string,
	dryRun: boolean
): Promise<string> {
	try {
		const counterpartyDoc = await getDoc(doc(db, 'counterparties', counterpartyId));
		if (counterpartyDoc.exists()) {
			return counterpartyDoc.data().name as string;
		}

		// Fallback: try old clients collection
		const clientDoc = await getDoc(doc(db, 'clients', counterpartyId));
		if (clientDoc.exists()) {
			return clientDoc.data().name as string;
		}

		// Client doesn't exist - create from contract data
		return await createCounterpartyFromContractData(counterpartyId, contractData, ownerUid, dryRun);
	} catch (error) {
		console.warn(`Could not fetch counterparty name for ${counterpartyId}:`, error);
		return 'Unknown Client';
	}
}

/**
 * Get event name from events collection
 */
async function getEventName(eventId: string): Promise<string> {
	try {
		const eventDoc = await getDoc(doc(db, 'events', eventId));
		if (eventDoc.exists()) {
			return eventDoc.data().name as string;
		}
		return 'Unknown Event';
	} catch (error) {
		console.warn(`Could not fetch event name for ${eventId}:`, error);
		return 'Unknown Event';
	}
}

/**
 * Migrate event planning contracts - update in place with new fields
 *
 * @param eventPlanningEventMap - Map of contractId → eventId from createInitialEvents
 * @param dryRun - If true, log what would happen without writing to database
 * @returns Migration result with stats and errors
 */
export async function migrateEventPlanningContracts(
	eventPlanningEventMap: Map<string, string>,
	dryRun: boolean = true
): Promise<MigrationResult> {
	const startTime = Date.now();
	const errors: Array<{ id: string; error: string }> = [];
	let successful = 0;

	console.log('\n=== Event Planning Contract Migration ===');
	console.log(`Mode: ${dryRun ? 'DRY RUN (no writes)' : 'LIVE (writing to database)'}`);
	console.log('Source: event-planning-contracts collection');
	console.log('Action: Update in-place with eventId, counterpartyId, and v2 fields\n');

	try {
		// Fetch all event planning contracts
		const contractsSnapshot = await getDocs(collection(db, 'event-planning-contracts'));
		const total = contractsSnapshot.size;

		console.log(`Found ${total} event planning contracts to migrate\n`);

		if (total === 0) {
			console.log('No event planning contracts found. Migration complete.\n');
			return {
				total: 0,
				successful: 0,
				failed: 0,
				errors: [],
				duration: Date.now() - startTime
			};
		}

		// Process each contract
		for (const [index, contractDoc] of contractsSnapshot.docs.entries()) {
			const contractId = contractDoc.id;

			try {
				const contractData = contractDoc.data() as Omit<V1EventPlanningContract, 'id'>;
				const v1Contract: V1EventPlanningContract = { id: contractId, ...contractData };

				// Get eventId from map
				const eventId = eventPlanningEventMap.get(contractId);
				if (!eventId) {
					throw new Error(`No event mapping found for contract ${contractId}`);
				}

				// Get or create counterparty from contract data
				const counterpartyName = await getOrCreateCounterparty(
					v1Contract.locationId,
					v1Contract.contractData,
					v1Contract.ownerUid,
					dryRun
				);
				const eventName = await getEventName(eventId);

				// Prepare update fields (only new v2 fields)
				const updateFields = {
					// Type discriminator (required by BaseContract)
					type: 'event-planning' as const,

					// New relationships
					eventId,
					counterpartyId: v1Contract.locationId,

					// Denormalized names
					counterpartyName,
					eventName,

					// New fields for BaseContract compatibility
					contractValue: v1Contract.contractData.contractValueVND,
					currency: 'VND' as const,
					notes: null,

					// Update timestamp
					updatedAt: serverTimestamp()
				};

				if (dryRun) {
					console.log(`[${index + 1}/${total}] Would update contract ${v1Contract.contractNumber}`);
					console.log(`  → Add eventId: ${eventId}`);
					console.log(`  → Add counterpartyId: ${v1Contract.locationId}`);
					console.log(`  → Event: ${eventName}`);
					console.log(`  → Client: ${counterpartyName}`);
					console.log(`  → Value: ${updateFields.contractValue} VND\n`);
				} else {
					// Update contract in-place
					const contractRef = doc(db, 'event-planning-contracts', contractId);
					await updateDoc(contractRef, updateFields);

					console.log(
						`[${index + 1}/${total}] ✓ Updated contract ${v1Contract.contractNumber} (${contractId})`
					);
				}

				successful++;
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : String(error);
				errors.push({ id: contractId, error: errorMessage });
				console.error(
					`[${index + 1}/${total}] ✗ ERROR updating contract ${contractId}:`,
					errorMessage
				);
			}

			// Progress indicator every 10 documents
			if ((index + 1) % 10 === 0 && index + 1 < total) {
				console.log(
					`--- Progress: ${index + 1}/${total} (${Math.round(((index + 1) / total) * 100)}%) ---\n`
				);
			}
		}

		// Summary
		const duration = Date.now() - startTime;
		const failed = errors.length;

		console.log('\n=== Migration Summary ===');
		console.log(`Total event planning contracts: ${total}`);
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
		}

		console.log('==============================\n');

		return {
			total,
			successful,
			failed,
			errors,
			duration
		};
	} catch (error) {
		console.error('FATAL ERROR during event planning contract migration:', error);
		throw error;
	}
}
