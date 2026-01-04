import { db } from '$lib/config/firebase';
import {
	collection,
	getDocs,
	doc,
	setDoc,
	getDoc,
	serverTimestamp,
	type Timestamp
} from 'firebase/firestore';
import type { ServiceProvisionContract } from '$lib/types/v2';
import type { ContractData } from '$lib/schemas/contract';
import type { MigrationResult } from './migrateClients';

/**
 * V1 Service Contract (from Firestore)
 */
interface V1ServiceContract {
	id: string;
	type: 'service';
	contractData: ContractData;
	contractNumber: string;
	createdAt: Timestamp;
	ownerUid: string;
	locationId: string; // Client ID (becomes counterpartyId)
	status: 'draft' | 'generated';
	paymentStatus: 'unpaid' | 'paid';
	paidAt: Timestamp | null;
	paidBy: string | null;
}

/**
 * Get counterparty name from counterparties collection
 */
async function getCounterpartyName(counterpartyId: string): Promise<string> {
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
		return 'Unknown Client';
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
 * Transform V1 Service Contract to V2 ServiceProvisionContract
 */
async function transformServiceContract(
	v1Contract: V1ServiceContract,
	eventId: string
): Promise<Omit<ServiceProvisionContract, 'id'>> {
	const { contractData } = v1Contract;

	// Calculate contract value (net fee + tax)
	const contractValue = contractData.netFee * (1 + contractData.taxRate / 100);

	// Fetch denormalized names
	const counterpartyName = await getCounterpartyName(v1Contract.locationId);
	const eventName = await getEventName(eventId);

	return {
		type: 'service-provision',

		// Relationships
		eventId,
		counterpartyId: v1Contract.locationId, // locationId is the client reference

		// Denormalized names
		counterpartyName,
		eventName,

		// Contract metadata
		contractNumber: v1Contract.contractNumber,
		contractValue,
		paymentDirection: 'receivable',
		currency: 'VND',

		// Payment tracking
		paymentStatus: v1Contract.paymentStatus,
		paidAt: v1Contract.paidAt,
		paidBy: v1Contract.paidBy,

		// Timestamps
		createdAt: v1Contract.createdAt,
		updatedAt: serverTimestamp() as any,
		ownerUid: v1Contract.ownerUid,

		// Service-specific fields
		jobName: contractData.jobName,
		jobContent: contractData.jobContent,
		numberOfPerformances: contractData.numberOfPerformances,
		firstPerformanceTime: contractData.firstPerformanceTime,
		startDate: contractData.startDate,
		endDate: contractData.endDate,
		taxRate: contractData.taxRate,
		netFee: contractData.netFee,
		status: v1Contract.status || 'generated', // Default to 'generated' if missing
		bankName: contractData.bankName,
		accountNumber: contractData.accountNumber,
		clientEmail: contractData.clientEmail,
		clientAddress: contractData.clientAddress,
		clientPhone: contractData.clientPhone,
		clientIdDocument: contractData.clientIdDocument,
		clientTaxId: contractData.clientTaxId || null,
		eventLocation: contractData.eventLocation,

		// Optional metadata
		notes: null
	};
}

/**
 * Migrate service contracts from v1 to v2
 *
 * @param serviceEventMap - Map of contractId → eventId from createInitialEvents
 * @param dryRun - If true, log what would happen without writing to database
 * @returns Migration result with stats and errors
 */
export async function migrateServiceContracts(
	serviceEventMap: Map<string, string>,
	dryRun: boolean = true
): Promise<MigrationResult> {
	const startTime = Date.now();
	const errors: Array<{ id: string; error: string }> = [];
	let successful = 0;

	console.log('\n=== Service Contract Migration ===');
	console.log(`Mode: ${dryRun ? 'DRY RUN (no writes)' : 'LIVE (writing to database)'}`);
	console.log('Source: service-contracts collection');
	console.log('Destination: service-provision-contracts collection\n');

	try {
		// Fetch all service contracts
		const contractsSnapshot = await getDocs(collection(db, 'service-contracts'));
		const total = contractsSnapshot.size;

		console.log(`Found ${total} service contracts to migrate\n`);

		if (total === 0) {
			console.log('No service contracts found. Migration complete.\n');
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
				const contractData = contractDoc.data() as Omit<V1ServiceContract, 'id'>;
				const v1Contract: V1ServiceContract = { id: contractId, ...contractData };

				// Get eventId from map
				const eventId = serviceEventMap.get(contractId);
				if (!eventId) {
					throw new Error(`No event mapping found for contract ${contractId}`);
				}

				// Transform to v2 format
				const v2Contract = await transformServiceContract(v1Contract, eventId);

				if (dryRun) {
					console.log(`[${index + 1}/${total}] Would migrate contract ${v1Contract.contractNumber}`);
					console.log(`  → Event: ${v2Contract.eventName} (${eventId})`);
					console.log(`  → Client: ${v2Contract.counterpartyName} (${v2Contract.counterpartyId})`);
					console.log(`  → Value: ${v2Contract.contractValue} VND\n`);
				} else {
					// Write to v2 collection (preserve original ID)
					const contractRef = doc(db, 'service-provision-contracts', contractId);
					await setDoc(contractRef, v2Contract);

					console.log(`[${index + 1}/${total}] ✓ Migrated contract ${v1Contract.contractNumber} (${contractId})`);
				}

				successful++;
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : String(error);
				errors.push({ id: contractId, error: errorMessage });
				console.error(`[${index + 1}/${total}] ✗ ERROR migrating contract ${contractId}:`, errorMessage);
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
		console.log(`Total service contracts: ${total}`);
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

		console.log('=========================\n');

		return {
			total,
			successful,
			failed,
			errors,
			duration
		};
	} catch (error) {
		console.error('FATAL ERROR during service contract migration:', error);
		throw error;
	}
}
