import { storage } from '$lib/config/firebase';
import { ref, listAll, getDownloadURL, uploadBytes, deleteObject, getBytes, getMetadata } from 'firebase/storage';

/**
 * Migration script to move documents from client-documents/ to counterparty-documents/
 * 
 * Usage:
 *   npx tsx src/lib/migration/migrateCounterpartyDocuments.ts [--live]
 * 
 * Without --live flag, runs in dry-run mode (no actual changes)
 */
async function migrateCounterpartyDocuments(dryRun: boolean = true) {
	console.log(`\n${dryRun ? '🔍 DRY RUN MODE' : '🚀 LIVE MODE'}\n`);

	try {
		// List all folders in client-documents/
		const oldPathRef = ref(storage, 'client-documents');
		const folders = await listAll(oldPathRef);

		console.log(`Found ${folders.prefixes.length} counterparty folders to migrate\n`);

		let successCount = 0;
		let errorCount = 0;

		for (const folder of folders.prefixes) {
			const counterpartyId = folder.name;
			console.log(`Processing counterparty: ${counterpartyId}`);

			// List all files in this folder
			const files = await listAll(folder);

			if (files.items.length === 0) {
				console.log(`  ⚠️  No files found, skipping\n`);
				continue;
			}

			console.log(`  Found ${files.items.length} file(s)`);

			for (const fileRef of files.items) {
				const fileName = fileRef.name;
				const newPathRef = ref(storage, `counterparty-documents/${counterpartyId}/${fileName}`);

				try {
					if (dryRun) {
						// In dry-run, just check if new path exists
						try {
							await getDownloadURL(newPathRef);
							console.log(`  ✓ ${fileName} - Would skip (already exists in new location)`);
						} catch {
							console.log(`  ✓ ${fileName} - Would migrate to counterparty-documents/${counterpartyId}/`);
						}
					} else {
						// Download file from old location
						const fileBytes = await getBytes(fileRef);
						const fileBlob = new Blob([fileBytes]);

						// Get metadata to preserve content type
						const metadata = await getMetadata(fileRef);
						const contentType = metadata.contentType || 'application/octet-stream';

						// Upload to new location
						await uploadBytes(newPathRef, fileBlob, {
							contentType
						});

						console.log(`  ✓ ${fileName} - Migrated to counterparty-documents/${counterpartyId}/`);

						// Delete from old location
						await deleteObject(fileRef);
						console.log(`  ✓ ${fileName} - Deleted from client-documents/${counterpartyId}/`);
					}
					successCount++;
				} catch (error) {
					console.error(`  ✗ ${fileName} - Error:`, error);
					errorCount++;
				}
			}

			console.log('');
		}

		console.log('\n' + '='.repeat(50));
		console.log(`Summary:`);
		console.log(`  Success: ${successCount}`);
		console.log(`  Errors: ${errorCount}`);
		console.log(`  Total: ${successCount + errorCount}`);
		console.log('='.repeat(50) + '\n');

		if (dryRun) {
			console.log('⚠️  This was a DRY RUN. No files were actually moved.');
			console.log('Run with --live flag to perform the actual migration.\n');
		} else {
			console.log('✅ Migration completed!\n');
		}
	} catch (error) {
		console.error('Fatal error during migration:', error);
		process.exit(1);
	}
}

// Parse command line arguments
const args = process.argv.slice(2);
const isLive = args.includes('--live');

migrateCounterpartyDocuments(!isLive)
	.then(() => {
		process.exit(0);
	})
	.catch((error) => {
		console.error('Migration failed:', error);
		process.exit(1);
	});
