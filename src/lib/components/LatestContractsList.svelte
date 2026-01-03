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

<div class="border-t border-border">
	<!-- Header -->
	<div class="flex items-center justify-between py-6">
		<div>
			<h2 class="text-lg font-bold tracking-tight text-foreground">Latest Contracts</h2>
		</div>
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
		<div class="max-h-96 overflow-y-auto">
			<!-- Column Headers (Desktop only) -->
			<div class="hidden md:grid grid-cols-16 gap-3 items-center bg-slate-200 px-4">
				<div class="col-span-4 text-sm font-semibold px-3 py-3 border-r border-white">Event</div>
				<div class="col-span-3 text-sm font-semibold px-3 py-3 border-r border-white">Client</div>
				<div class="col-span-2 text-sm font-semibold px-3 py-3 text-right border-r border-white">Value</div>
				<div class="col-span-2 text-sm font-semibold px-3 py-3 text-center border-r border-white">Date</div>
				<div class="col-span-2 text-sm font-semibold px-3 py-3 border-r border-white">Location</div>
				<div class="col-span-1 text-sm font-semibold px-3 py-3 text-center border-r border-white">Type</div>
				<div class="col-span-1 text-sm font-semibold px-3 py-3 text-center border-r border-white">Status</div>
				<div class="col-span-1 text-sm font-semibold px-3 py-3 text-center">Actions</div>
			</div>

			<!-- Contract List -->
			{#each latestContracts as contract, index (contract.id)}
				<ContractListItem {contract} {index} />
			{/each}
		</div>
	{/if}
</div>
