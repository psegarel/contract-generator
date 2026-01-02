<script lang="ts">
	import { onMount } from 'svelte';
	import {
		collection,
		getDocs,
		writeBatch,
		doc,
		query,
		orderBy
	} from 'firebase/firestore';
	import { db } from '$lib/config/firebase';
	import { authState } from '$lib/state/auth.svelte';
	import AuthGuard from '$lib/components/AuthGuard.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { toast } from 'svelte-sonner';
	import { CheckCircle, XCircle, Loader2, AlertCircle, User } from 'lucide-svelte';

	let isLoading = $state(false);
	let isMigrating = $state(false);
	let contracts = $state<any[]>([]);
	let migrationStatus = $state<'idle' | 'success' | 'error'>('idle');
	let migrationMessage = $state('');

	async function loadContracts() {
		isLoading = true;
		try {
			const oldCollection = collection(db, 'contracts');
			const q = query(oldCollection, orderBy('createdAt', 'desc'));
			const querySnapshot = await getDocs(q);

			contracts = querySnapshot.docs.map((doc) => ({
				id: doc.id,
				data: doc.data()
			}));

			toast.success(`Found ${contracts.length} contracts to migrate`);
		} catch (error) {
			console.error('Error loading contracts:', error);
			toast.error('Failed to load contracts');
		} finally {
			isLoading = false;
		}
	}

	async function runMigration(deleteOld: boolean = false) {
		if (contracts.length === 0) {
			toast.error('No contracts to migrate. Click "Load Contracts" first.');
			return;
		}

		const confirmed = confirm(
			`Are you sure you want to migrate ${contracts.length} contracts to the new "service-contracts" collection?${deleteOld ? '\n\nWARNING: This will DELETE the old contracts!' : ''}`
		);

		if (!confirmed) return;

		isMigrating = true;
		migrationStatus = 'idle';

		try {
			const batchSize = 500;
			const newCollection = collection(db, 'service-contracts');
			const oldCollection = collection(db, 'contracts');
			let migratedCount = 0;

			for (let i = 0; i < contracts.length; i += batchSize) {
				const batch = writeBatch(db);
				const batchContracts = contracts.slice(i, i + batchSize);

				for (const contract of batchContracts) {
					// Create new document in service-contracts collection with same ID
					const newDocRef = doc(newCollection, contract.id);

					// Remove the 'type' field since we're in a service-specific collection now
					const { type, ...dataWithoutType } = contract.data;

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
			}

			migrationStatus = 'success';
			migrationMessage = `Successfully migrated ${migratedCount} contracts!`;
			toast.success(migrationMessage);
		} catch (error) {
			console.error('Migration failed:', error);
			migrationStatus = 'error';
			migrationMessage = `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
			toast.error(migrationMessage);
		} finally {
			isMigrating = false;
		}
	}

	onMount(() => {
		loadContracts();
	});
</script>

<AuthGuard>
	<div class="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
		<div class="max-w-4xl mx-auto">
			<div class="mb-8">
				<h1 class="text-3xl font-medium text-foreground mb-3">Contract Migration</h1>
				<p class="text-muted-foreground">
					Migrate contracts from "contracts" to "service-contracts" collection
				</p>
			</div>

			<div class="space-y-6">
				<!-- User Info Card -->
				<Card>
					<CardHeader>
						<CardTitle>Authentication Status</CardTitle>
					</CardHeader>
					<CardContent class="space-y-2">
						{#if authState.user}
							<div class="flex items-center gap-3 text-foreground">
								<User class="h-5 w-5 text-green-500" />
								<div>
									<div class="font-medium">{authState.user.email}</div>
									<div class="text-xs text-muted-foreground">UID: {authState.user.uid}</div>
								</div>
							</div>
						{:else}
							<div class="flex items-center gap-3 text-muted-foreground">
								<XCircle class="h-5 w-5" />
								<span>Not authenticated</span>
							</div>
						{/if}
					</CardContent>
				</Card>

				<!-- Status Card -->
				<Card>
					<CardHeader>
						<CardTitle>Migration Status</CardTitle>
						<CardDescription>
							This page migrates contracts from the old "contracts" collection to the new
							"service-contracts" collection.
						</CardDescription>
					</CardHeader>
					<CardContent class="space-y-4">
						{#if isLoading}
							<div class="flex items-center gap-3 text-muted-foreground">
								<Loader2 class="h-5 w-5 animate-spin" />
								<span>Loading contracts...</span>
							</div>
						{:else if contracts.length > 0}
							<div class="flex items-center gap-3 text-foreground">
								<AlertCircle class="h-5 w-5 text-blue-500" />
								<span>Found {contracts.length} contracts ready to migrate</span>
							</div>
						{:else}
							<div class="flex items-center gap-3 text-muted-foreground">
								<AlertCircle class="h-5 w-5" />
								<span>No contracts found in "contracts" collection</span>
							</div>
						{/if}

						{#if migrationStatus === 'success'}
							<div class="flex items-center gap-3 text-green-600 dark:text-green-400">
								<CheckCircle class="h-5 w-5" />
								<span>{migrationMessage}</span>
							</div>
						{:else if migrationStatus === 'error'}
							<div class="flex items-center gap-3 text-red-600 dark:text-red-400">
								<XCircle class="h-5 w-5" />
								<span>{migrationMessage}</span>
							</div>
						{/if}
					</CardContent>
				</Card>

				<!-- Contracts List -->
				{#if contracts.length > 0}
					<Card>
						<CardHeader>
							<CardTitle>Contracts to Migrate ({contracts.length})</CardTitle>
						</CardHeader>
						<CardContent>
							<div class="space-y-2 max-h-96 overflow-y-auto">
								{#each contracts as contract, index}
									<div
										class="flex items-center justify-between p-3 bg-muted/50 rounded-md text-sm"
									>
										<div class="flex items-center gap-3">
											<span class="text-muted-foreground">#{index + 1}</span>
											<div>
												<div class="font-medium">
													{contract.data.contractData?.clientName || 'Unknown'}
												</div>
												<div class="text-xs text-muted-foreground">
													{contract.data.contractNumber || 'No number'} • {contract.id}
												</div>
											</div>
										</div>
										<div class="text-xs text-muted-foreground">
											{contract.data.type || 'service'}
										</div>
									</div>
								{/each}
							</div>
						</CardContent>
					</Card>
				{/if}

				<!-- Actions -->
				<Card>
					<CardHeader>
						<CardTitle>Migration Actions</CardTitle>
						<CardDescription>
							Choose whether to keep or delete the old contracts after migration.
						</CardDescription>
					</CardHeader>
					<CardContent class="space-y-3">
						<Button
							onclick={() => runMigration(false)}
							disabled={isMigrating || isLoading || contracts.length === 0}
							class="w-full"
							variant="default"
						>
							{#if isMigrating}
								<Loader2 class="h-4 w-4 mr-2 animate-spin" />
								Migrating...
							{:else}
								Migrate (Keep Old Data)
							{/if}
						</Button>

						<Button
							onclick={() => runMigration(true)}
							disabled={isMigrating || isLoading || contracts.length === 0}
							class="w-full"
							variant="destructive"
						>
							{#if isMigrating}
								<Loader2 class="h-4 w-4 mr-2 animate-spin" />
								Migrating...
							{:else}
								Migrate (Delete Old Data)
							{/if}
						</Button>

						<Button
							onclick={loadContracts}
							disabled={isMigrating || isLoading}
							class="w-full"
							variant="outline"
						>
							{#if isLoading}
								<Loader2 class="h-4 w-4 mr-2 animate-spin" />
								Loading...
							{:else}
								Reload Contracts
							{/if}
						</Button>
					</CardContent>
				</Card>

				<!-- Warning -->
				<div class="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
					<h3 class="font-medium text-yellow-800 dark:text-yellow-200 mb-2">⚠️ Important Notes</h3>
					<ul class="text-sm text-yellow-700 dark:text-yellow-300 space-y-1 list-disc list-inside">
						<li>This migration is safe to run multiple times (it uses the same document IDs)</li>
						<li>"Keep Old Data" is recommended - you can delete it later after verification</li>
						<li>"Delete Old Data" permanently removes contracts from the old collection</li>
						<li>Make sure to test that everything works before deleting old data</li>
					</ul>
				</div>
			</div>
		</div>
	</div>
</AuthGuard>
