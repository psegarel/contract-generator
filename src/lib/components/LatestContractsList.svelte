<script lang="ts">
	import { serviceContractState } from '$lib/state/serviceContractState.svelte';
	import { contractState } from '$lib/state/contractState.svelte';
	import { mergeAndSortContracts, type UnifiedContract } from '$lib/utils/mergeContracts';
	import ContractListItem from './ContractListItem.svelte';
	import { Button } from '$lib/components/ui/button';
	import { ArrowRight, FileText } from 'lucide-svelte';

	interface Props {
		limit?: number;
	}

	let { limit }: Props = $props();

	let latestContracts = $derived<UnifiedContract[]>(
		mergeAndSortContracts(serviceContractState.contracts, contractState.contracts, limit)
	);

	let isLoading = $derived(serviceContractState.isLoading || contractState.isLoading);
	let hasError = $derived(serviceContractState.error !== null || contractState.error !== null);

	$effect(() => {
		serviceContractState.init();
		return () => serviceContractState.destroy();
	});
</script>

<div class="p-6 rounded-2xl border border-border bg-card/50 backdrop-blur-sm">
	<!-- Header -->
	<div class="flex items-center justify-between mb-6">
		<div>
			<h2 class="text-lg font-bold tracking-tight text-foreground">Latest Contracts</h2>
		</div>
		<!-- <Button variant="ghost" size="sm" href="/contracts" class="gap-1.5">
			View All
			<ArrowRight class="h-3.5 w-3.5" />
		</Button> -->
	</div>

	<!-- Content -->
	{#if isLoading}
		<div class="py-12 text-center text-muted-foreground">
			<div
				class="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3"
			></div>
			<p class="text-sm">Loading contracts...</p>
		</div>
	{:else if hasError}
		<div class="py-12 text-center text-destructive">
			<FileText class="h-12 w-12 mx-auto mb-3 opacity-50" />
			<p class="text-sm">Failed to load contracts</p>
		</div>
	{:else if latestContracts.length === 0}
		<div class="py-12 text-center text-muted-foreground">
			<FileText class="h-12 w-12 mx-auto mb-3 opacity-50" />
			<p class="text-sm font-medium mb-1">No contracts yet</p>
			<p class="text-xs">Create your first contract to see it here</p>
		</div>
	{:else}
		<div class="-mx-6">
			{#each latestContracts as contract (contract.id)}
				<div class="px-6">
					<ContractListItem {contract} />
				</div>
			{/each}
		</div>
	{/if}
</div>
