<script lang="ts">
	import type { PageData } from './$types';
	import { ContractsList } from '$lib/components/v2/contracts';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft, FileText } from '@lucide/svelte';
	import { onMount, onDestroy } from 'svelte';
	import { serviceProvisionContractState, eventPlanningContractState } from '$lib/state/v2';
	import type { BaseContract } from '$lib/types/v2';
	import PageHeader from '$lib/components/PageHeader.svelte';

	let { data }: { data: PageData } = $props();

	// Initialize contract states on mount
	onMount(() => {
		serviceProvisionContractState.init();
		eventPlanningContractState.init();
	});

	// Cleanup on destroy
	onDestroy(() => {
		serviceProvisionContractState.destroy();
		eventPlanningContractState.destroy();
	});

	// Get all contracts and filter by counterparty ID
	let allContracts = $derived<BaseContract[]>([
		...serviceProvisionContractState.contracts,
		...eventPlanningContractState.contracts
	]);

	let filteredContracts = $derived(
		allContracts.filter((c) => c.counterpartyId === data.counterparty.id)
	);
</script>

<div class="flex h-full flex-col">
	<PageHeader
		title={`Contracts - ${data.counterparty.name}`}
		description={`${filteredContracts.length} ${filteredContracts.length === 1 ? 'contract' : 'contracts'}`}
	>
		{#snippet leading()}
			<Button variant="ghost" size="sm" href="/counterparties">
				<ArrowLeft class="size-4" />
				Back
			</Button>
		{/snippet}
		{#snippet icon()}
			<FileText class="size-5" />
		{/snippet}
	</PageHeader>

	<!-- Contracts List -->
	<div class="flex-1 min-h-0">
		<ContractsList contracts={filteredContracts} title="" showHeaders={true} />
	</div>
</div>
