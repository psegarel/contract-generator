<script lang="ts">
	import type { BaseContract } from '$lib/types/v2';
	import { serviceProvisionContractState, eventPlanningContractState } from '$lib/state/v2';
	import ContractsList from './ContractsList.svelte';
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
		serviceProvisionContractState.isLoading || eventPlanningContractState.isLoading
	);

	let hasError = $derived(
		serviceProvisionContractState.error !== null || eventPlanningContractState.error !== null
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
	{:else}
		<ContractsList contracts={allContracts} title="Latest Contracts" showHeaders={true} />
	{/if}
</div>
