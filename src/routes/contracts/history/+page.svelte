<script lang="ts">
	import { toast } from 'svelte-sonner';
	import AuthGuard from '$lib/components/AuthGuard.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { getAllContracts, type SavedContract } from '$lib/utils/contracts';
	import { generateServiceContract } from '$lib/utils/serviceContractGenerator';
	import { Download, Pencil, FileText } from 'lucide-svelte';
	import { Card } from '$lib/components/ui/card';
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

		// Fetch all contracts when user is authenticated
		isLoading = true;

		getAllContracts()
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

	function formatDateString(dateString: string): string {
		if (!dateString) return 'N/A';
		const date = new Date(dateString);
		return new Intl.DateTimeFormat('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
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
				<div>
					{#each contracts as contract (contract.id)}
						<div class="py-6 border-b border-dotted border-border">
							<div class="flex items-start justify-between">
								<div class="flex-1">
									<h3 class="text-lg font-semibold">
										{contract.contractData.eventName}
									</h3>
									<div class="text-lg text-muted-foreground mb-2">
										{formatDateString(contract.contractData.startDate)}
									</div>

									<div class="space-y-1 text-sm text-muted-foreground">
										<div>{contract.contractData.eventLocation}</div>
										<div>{contract.contractData.clientName}</div>
									</div>
								</div>

								<div class="flex gap-2 ml-4">
									<Button
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
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</AuthGuard>
