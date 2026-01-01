<script lang="ts">
	import type { PageData } from './$types';
	import type { SavedContract } from '$lib/utils/contracts';
	import AuthGuard from '$lib/components/AuthGuard.svelte';
	import ContractList from '$lib/components/ContractList.svelte';
	import { FileText, ArrowLeft } from 'lucide-svelte';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';

	let { data }: { data: PageData } = $props();

	function handleContractsUpdate(updatedContracts: SavedContract[]) {
		data.contracts = updatedContracts;
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
					Contracts for {data.locationName}
				</h1>
				<p class="text-muted-foreground">View all contracts for this location</p>
			</div>

			{#if data.contracts.length === 0}
				<Card class="p-12 text-center">
					<FileText class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
					<h3 class="text-lg font-medium text-foreground mb-2">No contracts found</h3>
					<p class="text-muted-foreground mb-6">
						No contracts have been created for this location yet.
					</p>
					<Button href="/contracts">Create Contract</Button>
				</Card>
			{:else}
				<ContractList
					contracts={data.contracts}
					showLocationLink={false}
					onContractsUpdate={handleContractsUpdate}
				/>
			{/if}
		</div>
	</div>
</AuthGuard>
