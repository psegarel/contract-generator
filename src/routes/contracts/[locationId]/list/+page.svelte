<script lang="ts">
	import { page } from '$app/stores';
	import { toast } from 'svelte-sonner';
	import AuthGuard from '$lib/components/AuthGuard.svelte';
	import ContractList from '$lib/components/ContractList.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { getContractsByLocationId, type SavedContract } from '$lib/utils/contracts';
	import { getLocation } from '$lib/utils/locations';
	import { FileText, ArrowLeft } from 'lucide-svelte';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';

	let contracts = $state<SavedContract[]>([]);
	let locationName = $state<string>('');
	let isLoading = $state(true);

	// Get locationId from URL params
	const locationId = $derived($page.params.locationId);

	// Reactively fetch contracts and location info when params or auth changes
	$effect(() => {
		const userId = authStore.user?.uid;

		if (!userId || !locationId) {
			isLoading = false;
			contracts = [];
			return;
		}

		// Fetch location info and contracts
		isLoading = true;

		Promise.all([
			getLocation(locationId),
			getContractsByLocationId(locationId)
		])
			.then(([location, fetchedContracts]) => {
				locationName = location?.name || 'Unknown Location';
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

	function handleContractsUpdate(updatedContracts: SavedContract[]) {
		contracts = updatedContracts;
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
					Contracts for {locationName}
				</h1>
				<p class="text-muted-foreground">View all contracts for this location</p>
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
						No contracts have been created for this location yet.
					</p>
					<Button href="/contracts">Create Contract</Button>
				</Card>
			{:else}
				<ContractList {contracts} showLocationLink={false} onContractsUpdate={handleContractsUpdate} />
			{/if}
		</div>
	</div>
</AuthGuard>
