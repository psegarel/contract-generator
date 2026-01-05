<script lang="ts">
	import type { PageData } from './$types';
	import { normalizeEventPlanningContract, type UnifiedContract } from '$lib/utils/mergeContracts';
	import ContractListItem from '$lib/components/ContractListItem.svelte';
	import { FileText } from 'lucide-svelte';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';

	let { data }: { data: PageData } = $props();

	// Normalize event planning contracts to UnifiedContract format
	let contracts = $derived<UnifiedContract[]>(
		data.contracts.map(normalizeEventPlanningContract)
	);
</script>

<div>
	<div class="mb-8">
		<h1 class="text-3xl font-medium text-foreground mb-3">Event Planning Contracts</h1>
		<p class="text-muted-foreground">View and manage your event planning contracts</p>
	</div>

	{#if contracts.length === 0}
		<Card class="p-12 text-center">
			<FileText class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
			<h3 class="text-lg font-medium text-foreground mb-2">No event planning contracts found</h3>
			<p class="text-muted-foreground mb-6">
				You haven't created any event planning contracts yet. Create your first contract to see it here.
			</p>
			<Button href="/contracts/event-planning">Create Event Planning Contract</Button>
		</Card>
	{:else}
		<div>
			{#each contracts as contract, index (contract.id)}
				<ContractListItem {contract} {index} />
			{/each}
		</div>
	{/if}
</div>

