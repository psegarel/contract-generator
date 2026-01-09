import { db } from '$lib/config/firebase';
import {
	collection,
	getDocs,
	getDoc,
	doc,
	setDoc,
	deleteDoc,
	updateDoc,
	query,
	where,
	serverTimestamp
} from 'firebase/firestore';

/**
 * Migration result type
 */
export interface MigrationResult {
	counterpartyFound: boolean;
	newId: string | null;
	contractsUpdated: number;
	contractsFailed: number;
	errors: Array<{ collection: string; id: string; error: string }>;
	duration: number;
}

/**
 * Fix counterparty with bad ID "Hoi An, Vietnam"
 * - Creates new document with proper UUID
 * - Updates all contracts referencing the old ID
 * - Deletes the old document
 *
 * @param dryRun - If true, log what would happen without writing to database
 * @returns Migration result with stats and errors
 */
export async function fixCounterpartyId(dryRun: boolean = true): Promise<MigrationResult> {
	const startTime = Date.now();
	const result: MigrationResult = {
		counterpartyFound: false,
		newId: null,
		contractsUpdated: 0,
		contractsFailed: 0,
		errors: [],
		duration: 0
	};

	const OLD_ID = 'Hoi An, Vietnam';
	const EXPECTED_COMPANY_NAME = 'Công ty TNHH Một Thành Viên Thương Mại Du Lịch Và Dịch Vụ Xoài';

	try {
		console.log(
			dryRun
				? `🔍 DRY RUN: Fixing counterparty with bad ID "${OLD_ID}"...`
				: `🔄 Fixing counterparty with bad ID "${OLD_ID}"...\n`
		);

		// Step 1: Find the counterparty with bad ID
		const counterpartyRef = doc(db, 'counterparties', OLD_ID);
		const counterpartySnap = await getDoc(counterpartyRef);

		if (!counterpartySnap.exists()) {
			console.log(`❌ Counterparty with ID "${OLD_ID}" not found`);
			result.duration = Date.now() - startTime;
			return result;
		}

		const counterpartyData = counterpartySnap.data();
		result.counterpartyFound = true;

		// Verify it's the right counterparty
		if (counterpartyData.companyName !== EXPECTED_COMPANY_NAME) {
			console.log(`⚠️  Warning: Counterparty found but companyName doesn't match expected value.`);
			console.log(`   Expected: ${EXPECTED_COMPANY_NAME}`);
			console.log(`   Found: ${counterpartyData.companyName || '(missing)'}`);
		}

		console.log(`✓ Found counterparty: ${counterpartyData.name || '(no name)'}`);
		console.log(`  Company: ${counterpartyData.companyName || '(no company name)'}`);
		console.log(`  Type: ${counterpartyData.type || '(no type)'}\n`);

		// Step 2: Generate new UUID
		const newId = crypto.randomUUID();
		result.newId = newId;
		console.log(`📝 New ID will be: ${newId}\n`);

		// Step 3: Find all contracts referencing the old ID
		const collectionsToCheck = ['service-provision-contracts', 'event-planning-contracts'];
		const contractsToUpdate: Array<{ collection: string; id: string }> = [];

		for (const collectionName of collectionsToCheck) {
			const contractsQuery = query(
				collection(db, collectionName),
				where('counterpartyId', '==', OLD_ID)
			);
			const contractsSnapshot = await getDocs(contractsQuery);

			console.log(
				`Found ${contractsSnapshot.size} contracts in ${collectionName} with counterpartyId = "${OLD_ID}"`
			);

			for (const contractDoc of contractsSnapshot.docs) {
				contractsToUpdate.push({
					collection: collectionName,
					id: contractDoc.id
				});
			}
		}

		console.log(`\nTotal contracts to update: ${contractsToUpdate.length}\n`);

		if (dryRun) {
			console.log('[DRY RUN] Would perform the following actions:\n');
			console.log(`1. Create new counterparty document with ID: ${newId}`);
			console.log(`2. Update ${contractsToUpdate.length} contracts:`);
			contractsToUpdate.forEach(({ collection, id }) => {
				console.log(`   - ${collection}/${id}: counterpartyId "${OLD_ID}" → "${newId}"`);
			});
			console.log(`3. Delete old counterparty document: ${OLD_ID}`);
		} else {
			// Step 4: Create new counterparty document
			console.log(`Creating new counterparty document with ID: ${newId}...`);
			const newCounterpartyRef = doc(db, 'counterparties', newId);
			await setDoc(newCounterpartyRef, {
				...counterpartyData,
				updatedAt: serverTimestamp()
			});
			console.log(`✓ Created new counterparty document\n`);

			// Step 5: Update all contracts
			console.log(`Updating ${contractsToUpdate.length} contracts...`);
			for (const { collection: collectionName, id } of contractsToUpdate) {
				try {
					const contractRef = doc(db, collectionName, id);
					await updateDoc(contractRef, {
						counterpartyId: newId,
						updatedAt: serverTimestamp()
					});
					console.log(`✓ Updated ${collectionName}/${id}`);
					result.contractsUpdated++;
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : String(error);
					console.error(`✗ Failed to update ${collectionName}/${id}:`, errorMessage);
					result.errors.push({
						collection: collectionName,
						id,
						error: errorMessage
					});
					result.contractsFailed++;
				}
			}

			// Step 6: Delete old counterparty document
			console.log(`\nDeleting old counterparty document: ${OLD_ID}...`);
			await deleteDoc(counterpartyRef);
			console.log(`✓ Deleted old counterparty document`);
		}

		result.duration = Date.now() - startTime;

		console.log('\n' + '='.repeat(50));
		console.log('Migration Summary:');
		console.log(`Counterparty found: ${result.counterpartyFound ? 'Yes' : 'No'}`);
		if (result.newId) {
			console.log(`New ID: ${result.newId}`);
		}
		console.log(`Contracts updated: ${result.contractsUpdated}`);
		console.log(`Contracts failed: ${result.contractsFailed}`);
		console.log(`Duration: ${(result.duration / 1000).toFixed(2)}s`);
		if (result.errors.length > 0) {
			console.log('\nErrors:');
			result.errors.forEach(({ collection, id, error }) => {
				console.log(`  - ${collection}/${id}: ${error}`);
			});
		}
		console.log('='.repeat(50));

		return result;
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error('Migration failed:', errorMessage);
		result.errors.push({
			collection: 'migration',
			id: 'migration',
			error: errorMessage
		});
		result.duration = Date.now() - startTime;
		return result;
	}
}
