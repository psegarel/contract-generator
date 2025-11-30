<script lang="ts">
	import { toast } from 'svelte-sonner';
	import AuthGuard from '$lib/components/AuthGuard.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { getUserContracts, type SavedContract } from '$lib/utils/contracts';
	import { generateServiceContract } from '$lib/utils/serviceContractGenerator';
	import { Download, FileText, Calendar, User, Pencil } from 'lucide-svelte';
	import { Card, CardTitle, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';

	let contracts = $state<SavedContract[]>([]);
	let isLoading = $state(true);
	let downloadingIds = $state<Set<string>>(new Set());

	// Reactively fetch contracts when user authentication state changes
	$effect(() => {
		const userId = authStore.user?.uid;

		if (!userId) {
			isLoading = false;
			contracts = [];
			return;
		}

		// Fetch contracts when user is authenticated
		isLoading = true;

		getUserContracts(userId)
			.then((fetchedContracts) => {
				contracts = fetchedContracts;
			})
			.catch((error) => {
				console.error('Error loading contracts:', error);
				toast.error('Failed to load contracts');
				contracts = [];
			})
			.finally(() => {
				isLoading = false;
			});
	});

	async function handleDownload(contract: SavedContract) {
		downloadingIds.add(contract.id);
		downloadingIds = downloadingIds;

		try {
			const blob = await generateServiceContract(contract.contractData);
			const filename = `Contract_${contract.contractData.clientName.replace(/\s+/g, '_')}.docx`;

			// Try File System Access API
			if ('showSaveFilePicker' in window) {
				try {
					// @ts-expect-error - showSaveFilePicker is not yet in standard TS lib
					const handle = await window.showSaveFilePicker({
						suggestedName: filename,
						types: [
							{
								description: 'Word Document',
								accept: {
									'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
										'.docx'
									]
								}
							}
						]
					});
					const writable = await handle.createWritable();
					await writable.write(blob);
					await writable.close();
					return;
				} catch (err) {
					if (err && typeof err === 'object' && 'name' in err && err.name === 'AbortError') {
						return;
					}
				}
			}

			// Fallback download
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
			toast.success('Contract downloaded successfully!');
		} catch (error) {
			console.error('Error downloading contract:', error);
			toast.error('Failed to download contract. Please try again.');
		} finally {
			downloadingIds.delete(contract.id);
			downloadingIds = downloadingIds;
		}
	}

	function formatDate(timestamp: any): string {
		if (!timestamp) return 'N/A';
		const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
		return new Intl.DateTimeFormat('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}).format(date);
	}
</script>

<AuthGuard>
	<div class="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
		<div class="max-w-6xl mx-auto">
			<div class="mb-8">
				<h1 class="text-3xl font-medium text-foreground mb-3">Contract History</h1>
				<p class="text-muted-foreground">View and download previously generated contracts</p>
			</div>

			{#if isLoading}
				<div class="flex justify-center items-center py-12">
					<div class="text-muted-foreground">Loading contracts...</div>
				</div>
			{:else if contracts.length === 0}
				<Card class="p-12 text-center">
					<FileText class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
					<h3 class="text-lg font-medium text-foreground mb-2">No contracts found</h3>
					<p class="text-muted-foreground mb-6">
						You haven't generated any contracts yet. Create your first contract to see it here.
					</p>
					<Button href="/contracts">Create Contract</Button>
				</Card>
			{:else}
				<div class="grid gap-4">
					{#each contracts as contract (contract.id)}
						<Card class="hover:shadow-md transition-shadow">
							<CardContent class="p-6">
								<div class="flex items-start justify-between">
									<div class="flex-1">
										<div class="flex items-center space-x-3 mb-3">
											<FileText class="h-5 w-5 text-primary" />
											<CardTitle class="text-lg">
												{contract.type === 'service' ? 'Service Contract' : 'Contract'}
											</CardTitle>
											<span class="text-xs font-mono text-muted-foreground px-2 py-1 bg-muted rounded">
												{contract.contractNumber}
											</span>
										</div>

										<div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
											<div class="flex items-center space-x-2 text-muted-foreground">
												<User class="h-4 w-4" />
												<span>Client: {contract.contractData.clientName}</span>
											</div>
											<div class="flex items-center space-x-2 text-muted-foreground">
												<Calendar class="h-4 w-4" />
												<span>Created: {formatDate(contract.createdAt)}</span>
											</div>
										</div>

										{#if contract.contractData.jobName}
											<div class="mt-2 text-sm text-muted-foreground">
												Job: {contract.contractData.jobName}
											</div>
										{/if}
									</div>

									<div class="flex gap-2 ml-4">
										<Button
											variant="success"
											size="sm"
											href="/contracts/service-contract?edit={contract.id}"
										>
											<span class="flex items-center space-x-2">
												<Pencil class="h-4 w-4" />
												<span>Edit</span>
											</span>
										</Button>
										<Button
											variant="outline"
											size="sm"
											onclick={() => handleDownload(contract)}
											disabled={downloadingIds.has(contract.id)}
										>
											{#if downloadingIds.has(contract.id)}
												<span class="flex items-center space-x-2">
													<span class="animate-spin">⏳</span>
													<span>Downloading...</span>
												</span>
											{:else}
												<span class="flex items-center space-x-2">
													<Download class="h-4 w-4" />
													<span>Download</span>
												</span>
											{/if}
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</AuthGuard>
