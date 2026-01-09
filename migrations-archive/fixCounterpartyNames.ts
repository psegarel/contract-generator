import { db } from '$lib/config/firebase';
import { collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';

/**
 * Fix counterpartyName and eventName in all contracts
 *
 * This script updates the denormalized name fields that may have been set to
 * "Unknown Client" or "Unknown Event" during migration if the lookups failed.
 */

interface ContractToFix {
	collectionName: string;
	id: string;
	counterpartyId: string;
	eventId: string | null;
	currentCounterpartyName: string;
	currentEventName: string | null;
}

/**
 * Get counterparty name from counterparties collection
 */
async function getCounterpartyName(counterpartyId: string): Promise<string | null> {
	try {
		const counterpartyDoc = await getDoc(doc(db, 'counterparties', counterpartyId));
		if (counterpartyDoc.exists()) {
			return counterpartyDoc.data().name as string;
		}
		return null;
	} catch (error) {
		console.error(`Error fetching counterparty ${counterpartyId}:`, error);
		return null;
	}
}

/**
 * Get event name from events collection
 */
async function getEventName(eventId: string): Promise<string | null> {
	try {
		const eventDoc = await getDoc(doc(db, 'events', eventId));
		if (eventDoc.exists()) {
			return eventDoc.data().name as string;
		}
		return null;
	} catch (error) {
		console.error(`Error fetching event ${eventId}:`, error);
		return null;
	}
}

/**
 * Find all contracts with "Unknown Client" or "Unknown Event"
 */
async function findContractsToFix(): Promise<ContractToFix[]> {
	const contractsToFix: ContractToFix[] = [];

	// Collections to check
	const collections = [
		'service-provision-contracts',
		'event-planning-contracts'
	];

	for (const collectionName of collections) {
		console.log(`\nScanning ${collectionName}...`);
		const snapshot = await getDocs(collection(db, collectionName));

		for (const docSnap of snapshot.docs) {
			const data = docSnap.data();
			const counterpartyName = data.counterpartyName as string;
			const eventName = data.eventName as string | null;

			// Check if names need fixing
			if (
				counterpartyName === 'Unknown Client' ||
				eventName === 'Unknown Event' ||
				!counterpartyName ||
				!eventName
			) {
				contractsToFix.push({
					collectionName,
					id: docSnap.id,
					counterpartyId: data.counterpartyId as string,
					eventId: data.eventId as string | null,
					currentCounterpartyName: counterpartyName,
					currentEventName: eventName
				});
			}
		}
	}

	return contractsToFix;
}

/**
 * Fix counterparty and event names in contracts
 */
export async function fixCounterpartyNames(dryRun: boolean = true): Promise<void> {
	console.log('\n=== Fix Counterparty & Event Names ===');
	console.log(`Mode: ${dryRun ? 'DRY RUN (no writes)' : 'LIVE (writing to database)'}\n`);

	// Find all contracts that need fixing
	const contractsToFix = await findContractsToFix();

	if (contractsToFix.length === 0) {
		console.log('✓ All contracts have valid names. Nothing to fix.\n');
		return;
	}

	console.log(`Found ${contractsToFix.length} contracts with invalid names:\n`);

	let fixed = 0;
	let failed = 0;

	// Process each contract
	for (const [index, contract] of contractsToFix.entries()) {
		try {
			const updates: Record<string, string | null> = {};

			// Fix counterparty name if needed
			if (contract.currentCounterpartyName === 'Unknown Client' || !contract.currentCounterpartyName) {
				const counterpartyName = await getCounterpartyName(contract.counterpartyId);
				if (counterpartyName) {
					updates.counterpartyName = counterpartyName;
				} else {
					console.warn(`  ⚠️  Counterparty ${contract.counterpartyId} not found for contract ${contract.id}`);
				}
			}

			// Fix event name if needed
			if (contract.eventId && (contract.currentEventName === 'Unknown Event' || !contract.currentEventName)) {
				const eventName = await getEventName(contract.eventId);
				if (eventName) {
					updates.eventName = eventName;
				} else {
					console.warn(`  ⚠️  Event ${contract.eventId} not found for contract ${contract.id}`);
				}
			}

			if (Object.keys(updates).length > 0) {
				if (dryRun) {
					console.log(`[${index + 1}/${contractsToFix.length}] Would update ${contract.collectionName}/${contract.id}:`);
					Object.entries(updates).forEach(([key, value]) => {
						console.log(`  → ${key}: "${value}"`);
					});
				} else {
					const docRef = doc(db, contract.collectionName, contract.id);
					await updateDoc(docRef, updates);
					console.log(`[${index + 1}/${contractsToFix.length}] ✓ Updated ${contract.collectionName}/${contract.id}`);
				}
				fixed++;
			}
		} catch (error) {
			failed++;
			console.error(`[${index + 1}/${contractsToFix.length}] ✗ ERROR updating ${contract.collectionName}/${contract.id}:`, error);
		}
	}

	console.log('\n=== Summary ===');
	console.log(`Contracts scanned: ${contractsToFix.length}`);
	console.log(`Fixed: ${fixed}`);
	console.log(`Failed: ${failed}`);

	if (dryRun) {
		console.log('\n⚠️  DRY RUN COMPLETE - No data was written');
	} else {
		console.log('\n✓ FIX COMPLETE');
	}
	console.log('==================\n');
}
