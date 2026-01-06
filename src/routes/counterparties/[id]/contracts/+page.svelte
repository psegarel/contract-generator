<script lang="ts">
	import type { PageData } from './$types';
	import { ContractsList } from '$lib/components/v2/contracts';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft, FileText } from 'lucide-svelte';
	import { onMount, onDestroy } from 'svelte';
	import {
		serviceProvisionContractState,
		eventPlanningContractState
	} from '$lib/state/v2';
	import type { BaseContract } from '$lib/types/v2';

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

<div class="p-8">
	<!-- Header -->
	<div class="flex items-center justify-between mb-8">
		<div class="flex items-center gap-3">
			<Button variant="ghost" size="sm" href="/counterparties">
				<ArrowLeft class="w-4 h-4 mr-2" />
				Back
			</Button>
			<div
				class="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary"
			>
				<FileText class="w-6 h-6" />
			</div>
			<div>
				<h1 class="text-3xl font-bold tracking-tight text-foreground">
					Contracts - {data.counterparty.name}
				</h1>
				<p class="text-muted-foreground mt-1 text-sm">
					{filteredContracts.length}
					{filteredContracts.length === 1 ? 'contract' : 'contracts'}
				</p>
			</div>
		</div>
	</div>

	<!-- Contracts List -->
	<ContractsList contracts={filteredContracts} title="" showHeaders={true} />
</div>

