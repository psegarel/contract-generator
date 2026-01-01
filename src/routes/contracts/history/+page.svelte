<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import AuthGuard from '$lib/components/AuthGuard.svelte';
	import ContractList from '$lib/components/ContractList.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { getAllContracts, type SavedContract } from '$lib/utils/contracts';
	import { FileText } from 'lucide-svelte';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';

	let contracts = $state<SavedContract[]>([]);
	let isLoading = $state(true);

	async function loadContracts() {
		if (!authStore.user?.uid) {
			isLoading = false;
			contracts = [];
			return;
		}

		isLoading = true;

		try {
			contracts = await getAllContracts();
		} catch (error) {
			console.error('Error loading contracts:', error);
			toast.error('Failed to load contracts');
			contracts = [];
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		loadContracts();
	});

	function handleContractsUpdate(updatedContracts: SavedContract[]) {
		contracts = updatedContracts;
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
				<ContractList {contracts} showLocationLink={true} onContractsUpdate={handleContractsUpdate} />
			{/if}
		</div>
	</div>
</AuthGuard>
