import { db } from '$lib/config/firebase';
import { collection, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { ClientCounterparty } from '$lib/types/v2';

/**
 * Migration result type
 */
export interface MigrationResult {
	total: number;
	successful: number;
	failed: number;
	errors: Array<{ id: string; error: string }>;
	duration: number;
}

/**
 * V1 Client type (from Firestore)
 */
interface V1Client {
	id: string;
	ownerUid: string;
	name: string;
	email: string;
	phone: string;
	address: string;
	idDocument: string;
	taxId?: string | null;
	bankName?: string | null;
	accountNumber?: string | null;
	documents?: {
		image1?: unknown;
		image2?: unknown;
	};
	createdAt?: unknown;
	updatedAt?: unknown;
}

/**
 * Transform V1 Client to V2 ClientCounterparty
 */
function transformClient(v1Client: V1Client): Omit<ClientCounterparty, 'id'> {
	// Default all to 'individual' - can be manually updated after migration
	const clientType = 'individual';

	return {
		type: 'client',

		// Common fields (from BaseCounterparty)
		name: v1Client.name,
		email: v1Client.email || null,
		phone: v1Client.phone || null,
		address: v1Client.address || null,

		// Client-specific fields
		clientType,
		companyName: null, // Can be manually updated if needed
		representativeName: null,
		representativePosition: null,

		idDocument: v1Client.idDocument || null,
		taxId: v1Client.taxId || null,
		bankName: v1Client.bankName || null,
		bankAccountNumber: v1Client.accountNumber || null,

		// Timestamps
		createdAt: serverTimestamp() as any,
		updatedAt: serverTimestamp() as any,
		ownerUid: v1Client.ownerUid,

		// Optional metadata
		notes: null
	};
}

/**
 * Migrate clients from v1 to v2
 *
 * @param dryRun - If true, log what would happen without writing to database
 * @returns Migration result with stats and errors
 */
export async function migrateClients(dryRun: boolean = true): Promise<MigrationResult> {
	const startTime = Date.now();
	const errors: Array<{ id: string; error: string }> = [];
	let successful = 0;

	console.log('\n=== Client Migration ===');
	console.log(`Mode: ${dryRun ? 'DRY RUN (no writes)' : 'LIVE (writing to database)'}`);
	console.log('Source: clients collection');
	console.log('Destination: counterparties collection');
	console.log('Note: All clients default to clientType="individual" - update manually if needed\n');

	try {
		// Fetch all clients from v1 collection
		const clientsSnapshot = await getDocs(collection(db, 'clients'));
		const total = clientsSnapshot.size;

		console.log(`Found ${total} clients to migrate\n`);

		if (total === 0) {
			console.log('No clients found. Migration complete.\n');
			return {
				total: 0,
				successful: 0,
				failed: 0,
				errors: [],
				duration: Date.now() - startTime
			};
		}

		// Process each client
		for (const [index, clientDoc] of clientsSnapshot.docs.entries()) {
			const clientId = clientDoc.id;

			try {
				const clientData = clientDoc.data() as Omit<V1Client, 'id'>;
				const v1Client: V1Client = { id: clientId, ...clientData };

				// Transform to v2 format
				const v2Counterparty = transformClient(v1Client);

				if (dryRun) {
					// Log what would be created
					console.log(`[${index + 1}/${total}] Would migrate client "${v1Client.name}" (${clientId})`);
					console.log(`  → Type: client/${v2Counterparty.clientType}`);
					console.log(`  → Email: ${v2Counterparty.email}`);
					console.log(`  → Tax ID: ${v2Counterparty.taxId || 'none'}\n`);
				} else {
					// Write to v2 collection (preserve original ID)
					const counterpartyRef = doc(db, 'counterparties', clientId);
					await setDoc(counterpartyRef, v2Counterparty);

					console.log(`[${index + 1}/${total}] ✓ Migrated client "${v1Client.name}" (${clientId})`);
				}

				successful++;
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : String(error);
				errors.push({ id: clientId, error: errorMessage });
				console.error(`[${index + 1}/${total}] ✗ ERROR migrating client ${clientId}:`, errorMessage);
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
		console.log(`Total clients: ${total}`);
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
			console.log('  - Update clientType to "company" for event-planning clients if needed');
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
		console.error('FATAL ERROR during client migration:', error);
		throw error;
	}
}
