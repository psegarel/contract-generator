/**
 * Data Migration Script: Move contracts from "contracts" to "service-contracts" collection
 *
 * This script migrates all existing contracts to the new collection structure.
 *
 * Usage:
 *   pnpm tsx scripts/migrate-contracts.ts
 *
 * Options:
 *   --dry-run: Preview what would be migrated without making changes
 *   --delete-old: Delete documents from old collection after successful migration
 */

import { initializeApp } from 'firebase/app';
import {
	getFirestore,
	collection,
	getDocs,
	writeBatch,
	doc,
	query,
	orderBy
} from 'firebase/firestore';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

// Firebase configuration - load from environment variables
const firebaseConfig = {
	apiKey: process.env.VITE_FIREBASE_API_KEY,
	authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
	projectId: process.env.VITE_FIREBASE_PROJECT_ID,
	storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
	appId: process.env.VITE_FIREBASE_APP_ID
};

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const deleteOld = args.includes('--delete-old');

async function migrateContracts() {
	console.log('🚀 Starting contract migration...\n');
	console.log(`Mode: ${isDryRun ? 'DRY RUN (no changes will be made)' : 'LIVE MIGRATION'}`);
	console.log(`Delete old documents: ${deleteOld ? 'YES' : 'NO'}\n`);

	// Initialize Firebase
	const app = initializeApp(firebaseConfig);
	const db = getFirestore(app);

	// Get all contracts from old collection
	console.log('📥 Fetching contracts from "contracts" collection...');
	const oldCollection = collection(db, 'contracts');
	const q = query(oldCollection, orderBy('createdAt', 'desc'));
	const querySnapshot = await getDocs(q);

	const contracts = querySnapshot.docs.map((doc) => ({
		id: doc.id,
		data: doc.data()
	}));

	console.log(`Found ${contracts.length} contracts to migrate\n`);

	if (contracts.length === 0) {
		console.log('✅ No contracts to migrate');
		return;
	}

	// Preview contracts
	console.log('📋 Contracts to migrate:');
	contracts.forEach((contract, index) => {
		const data = contract.data as any;
		console.log(
			`  ${index + 1}. ${contract.id} - ${data.contractData?.clientName || 'Unknown'} (${data.contractNumber || 'No number'})`
		);
	});
	console.log('');

	if (isDryRun) {
		console.log('🔍 DRY RUN: No changes made. Run without --dry-run to perform migration.');
		return;
	}

	// Migrate contracts in batches (Firestore allows max 500 operations per batch)
	const batchSize = 500;
	const newCollection = collection(db, 'service-contracts');
	let migratedCount = 0;

	for (let i = 0; i < contracts.length; i += batchSize) {
		const batch = writeBatch(db);
		const batchContracts = contracts.slice(i, i + batchSize);

		console.log(
			`📝 Processing batch ${Math.floor(i / batchSize) + 1} (${batchContracts.length} contracts)...`
		);

		for (const contract of batchContracts) {
			// Create new document in service-contracts collection with same ID
			const newDocRef = doc(newCollection, contract.id);

			// Remove the 'type' field since we're in a service-specific collection now
			const { type, ...dataWithoutType } = contract.data as any;

			batch.set(newDocRef, dataWithoutType);

			// Optionally delete from old collection
			if (deleteOld) {
				const oldDocRef = doc(oldCollection, contract.id);
				batch.delete(oldDocRef);
			}
		}

		// Commit batch
		await batch.commit();
		migratedCount += batchContracts.length;
		console.log(`✅ Migrated ${migratedCount}/${contracts.length} contracts`);
	}

	console.log('\n🎉 Migration completed successfully!');
	console.log(`   - Migrated: ${migratedCount} contracts`);
	console.log(`   - Source: "contracts" collection`);
	console.log(`   - Destination: "service-contracts" collection`);
	if (deleteOld) {
		console.log(`   - Old documents: DELETED`);
	} else {
		console.log(
			`   - Old documents: KEPT (run with --delete-old to remove them after verifying migration)`
		);
	}
}

// Run migration
migrateContracts().catch((error) => {
	console.error('❌ Migration failed:', error);
	process.exit(1);
});
