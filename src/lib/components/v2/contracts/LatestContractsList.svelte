<script lang="ts">
	import type { BaseContract } from '$lib/types/v2';
	import {
		serviceProvisionContractState,
		eventPlanningContractState
	} from '$lib/state/v2';
	import ContractListItem from './ContractListItem.svelte';
	import { FileText } from 'lucide-svelte';

	interface Props {
		limit?: number;
	}

	let { limit }: Props = $props();

	// Merge all contract types into single array (TypeScript inheritance makes this work!)
	let allContracts = $derived<BaseContract[]>(
		[
			...serviceProvisionContractState.contracts,
			...eventPlanningContractState.contracts
			// When other contract types are added, just spread them here!
			// ...venueRentalContractState.contracts,
			// ...performerBookingContractState.contracts,
			// ...equipmentRentalContractState.contracts,
			// etc.
		]
			.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
			.slice(0, limit)
	);

	let isLoading = $derived(
		serviceProvisionContractState.isLoading ||
			eventPlanningContractState.isLoading
	);

	let hasError = $derived(
		serviceProvisionContractState.error !== null ||
			eventPlanningContractState.error !== null
	);

	// Initialize subscriptions on mount
	$effect(() => {
		serviceProvisionContractState.init();
		eventPlanningContractState.init();

		return () => {
			serviceProvisionContractState.destroy();
			eventPlanningContractState.destroy();
		};
	});
</script>

<div class="border-t border-border">
	<!-- Header -->
	<div class="flex items-center justify-between py-6">
		<div>
			<h2 class="text-lg font-bold tracking-tight text-foreground">Latest Contracts</h2>
			{#if !isLoading && !hasError}
				<p class="text-sm text-muted-foreground mt-1">
					{allContracts.length} {allContracts.length === 1 ? 'contract' : 'contracts'}
				</p>
			{/if}
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
	{:else if allContracts.length === 0}
		<div class="py-12 text-center text-muted-foreground">
			<FileText class="h-12 w-12 mx-auto mb-3 opacity-50" />
			<p class="text-sm font-medium mb-1">No contracts yet</p>
			<p class="text-xs">Create your first contract to see it here</p>
		</div>
	{:else}
		<div class="max-h-96 overflow-y-auto">
			<!-- Column Headers (Desktop only) -->
			<div class="hidden md:grid grid-cols-18 gap-3 items-center bg-slate-200 px-4">
				<div class="col-span-2 text-sm font-semibold px-3 py-3 border-r border-white">
					Contract #
				</div>
				<div class="col-span-3 text-sm font-semibold px-3 py-3 border-r border-white">Event</div>
				<div class="col-span-3 text-sm font-semibold px-3 py-3 border-r border-white">
					Counterparty
				</div>
				<div class="col-span-2 text-sm font-semibold px-3 py-3 text-right border-r border-white">
					Value
				</div>
				<div class="col-span-2 text-sm font-semibold px-3 py-3 text-center border-r border-white">
					Date
				</div>
				<div class="col-span-2 text-sm font-semibold px-3 py-3 text-center border-r border-white">
					Type
				</div>
				<div class="col-span-1 text-sm font-semibold px-3 py-3 text-center border-r border-white">
					AR/AP
				</div>
				<div class="col-span-2 text-sm font-semibold px-3 py-3 text-center border-r border-white">
					Status
				</div>
				<div class="col-span-1 text-sm font-semibold px-3 py-3 text-center">Actions</div>
			</div>

			<!-- Contract List -->
			{#each allContracts as contract, index (contract.id)}
				<ContractListItem {contract} {index} />
			{/each}
		</div>
	{/if}
</div>
