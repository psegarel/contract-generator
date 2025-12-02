<script lang="ts">
	import { page } from '$app/stores';
	import { toast } from 'svelte-sonner';
	import AuthGuard from '$lib/components/AuthGuard.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { getContractsByClientId, updatePaymentStatus, type SavedContract } from '$lib/utils/contracts';
	import { getClient } from '$lib/utils/clients';
	import { generateServiceContract } from '$lib/utils/serviceContractGenerator';
	import { Download, Pencil, FileText, DollarSign, ArrowLeft } from 'lucide-svelte';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';

	let contracts = $state<SavedContract[]>([]);
	let clientName = $state<string>('');
	let isLoading = $state(true);
	let downloadingIds = $state<Set<string>>(new Set());
	let updatingPaymentIds = $state<Set<string>>(new Set());

	// Get clientId from URL params
	const clientId = $derived($page.params.clientId);

	// Reactively fetch contracts and client info when params or auth changes
	$effect(() => {
		const userId = authStore.user?.uid;

		if (!userId || !clientId) {
			isLoading = false;
			contracts = [];
			return;
		}

		// Fetch client info and contracts
		isLoading = true;

		Promise.all([
			getClient(clientId),
			getContractsByClientId(clientId)
		])
			.then(([client, fetchedContracts]) => {
				clientName = client?.name || 'Unknown Client';
				contracts = fetchedContracts;
			})
			.catch((error) => {
				console.error('Error loading data:', error);
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

	async function togglePaymentStatus(contract: SavedContract) {
		if (!authStore.user?.uid || !authStore.isAdmin) {
			toast.error('Only admins can update payment status');
			return;
		}

		updatingPaymentIds.add(contract.id);
		updatingPaymentIds = updatingPaymentIds;

		try {
			const newStatus = contract.paymentStatus === 'paid' ? 'unpaid' : 'paid';
			await updatePaymentStatus(contract.id, newStatus, authStore.user.uid);

			// Update local state
			contracts = contracts.map((c) =>
				c.id === contract.id
					? { ...c, paymentStatus: newStatus, paidAt: newStatus === 'paid' ? new Date() as any : null, paidBy: newStatus === 'paid' ? authStore.user!.uid : null }
					: c
			);

			toast.success(`Payment status updated to ${newStatus}`);
		} catch (error) {
			console.error('Error updating payment status:', error);
			toast.error('Failed to update payment status');
		} finally {
			updatingPaymentIds.delete(contract.id);
			updatingPaymentIds = updatingPaymentIds;
		}
	}
</script>

<AuthGuard>
	<div class="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
		<div class="max-w-6xl mx-auto">
			<div class="mb-8">
				<Button href="/contracts/history" variant="ghost" size="sm" class="mb-4">
					<ArrowLeft class="h-4 w-4 mr-2" />
					Back to All Contracts
				</Button>
				<h1 class="text-3xl font-medium text-foreground mb-3">
					Contracts for {clientName}
				</h1>
				<p class="text-muted-foreground">View all contracts for this client</p>
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
						No contracts have been created for this client yet.
					</p>
					<Button href="/contracts">Create Contract</Button>
				</Card>
			{:else}
				<div>
					{#each contracts as contract (contract.id)}
						<div class="py-6 border-b border-dotted border-border">
							<div class="flex items-start justify-between">
								<div class="flex-1">
									<div class="flex items-center gap-3 mb-2">
										<h3 class="text-lg font-semibold">
											{contract.contractData.eventName}
										</h3>
										{#if contract.paymentStatus === 'paid'}
											<Badge variant="default" class="bg-emerald-500 hover:bg-emerald-600">Paid</Badge>
										{:else}
											<Badge variant="secondary">Unpaid</Badge>
										{/if}
									</div>
									<div class="text-lg text-muted-foreground mb-2">
										{formatDateString(contract.contractData.startDate)}
									</div>

									<div class="space-y-1 text-sm text-muted-foreground">
										<div>{contract.contractData.eventLocation}</div>
										<div>{contract.contractData.clientName}</div>
									</div>
								</div>

								<div class="flex gap-2 ml-4">
									{#if authStore.isAdmin}
										<Button
											variant="outline"
											size="sm"
											onclick={() => togglePaymentStatus(contract)}
											disabled={updatingPaymentIds.has(contract.id)}
										>
											{#if updatingPaymentIds.has(contract.id)}
												<span class="flex items-center space-x-2">
													<span class="animate-spin">⏳</span>
													<span>Updating...</span>
												</span>
											{:else}
												<span class="flex items-center space-x-2">
													<DollarSign class="h-4 w-4" />
													<span>{contract.paymentStatus === 'paid' ? 'Mark Unpaid' : 'Mark Paid'}</span>
												</span>
											{/if}
										</Button>
									{/if}
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
