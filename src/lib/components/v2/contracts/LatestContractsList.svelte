<script lang="ts">
	import type { BaseContract } from '$lib/types/v2';
	import {
		serviceProvisionContractState,
		eventPlanningContractState,
		equipmentRentalContractState
	} from '$lib/state/v2';
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
			...eventPlanningContractState.contracts,
			...equipmentRentalContractState.contracts
			// When other contract types are added, just spread them here!
			// ...venueRentalContractState.contracts,
			// ...performerBookingContractState.contracts,
			// etc.
		]
			.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
			.slice(0, limit)
	);

	let isLoading = $derived(
		serviceProvisionContractState.isLoading ||
			eventPlanningContractState.isLoading ||
			equipmentRentalContractState.isLoading
	);

	// Show errors per contract type, but don't block the whole list
	// If at least one contract type loaded successfully, show the list
	let hasAnyContracts = $derived(
		serviceProvisionContractState.contracts.length > 0 ||
			eventPlanningContractState.contracts.length > 0 ||
			equipmentRentalContractState.contracts.length > 0
	);

	let hasErrors = $derived({
		serviceProvision: serviceProvisionContractState.error !== null,
		eventPlanning: eventPlanningContractState.error !== null,
		equipmentRental: equipmentRentalContractState.error !== null
	});

	// Initialize subscriptions on mount
	$effect(() => {
		serviceProvisionContractState.init();
		eventPlanningContractState.init();
		equipmentRentalContractState.init();

		return () => {
			serviceProvisionContractState.destroy();
			eventPlanningContractState.destroy();
			equipmentRentalContractState.destroy();
		};
	});
</script>

<div class="border-t border-border">
	{#if isLoading && !hasAnyContracts}
		<div class="py-12 text-center text-muted-foreground">
			<div
				class="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3"
			></div>
			<p class="text-sm">Loading contracts...</p>
		</div>
	{:else if !hasAnyContracts && !isLoading}
		<div class="py-12 text-center text-muted-foreground">
			<FileText class="h-12 w-12 mx-auto mb-3 opacity-50" />
			<p class="text-sm">No contracts found</p>
		</div>
	{:else}
		<!-- Show error messages if any contract type failed, but still show the list -->
		{#if hasErrors.serviceProvision || hasErrors.eventPlanning || hasErrors.equipmentRental}
			<div class="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
				<p class="font-semibold mb-1">Some contracts failed to load:</p>
				<ul class="list-disc list-inside space-y-1">
					{#if hasErrors.serviceProvision}
						<li>Service Provision: {serviceProvisionContractState.error}</li>
					{/if}
					{#if hasErrors.eventPlanning}
						<li>Event Planning: {eventPlanningContractState.error}</li>
					{/if}
					{#if hasErrors.equipmentRental}
						<li>Equipment Rental: {equipmentRentalContractState.error}</li>
					{/if}
				</ul>
			</div>
		{/if}
		<ContractsList contracts={allContracts} title="Latest Contracts" showHeaders={true} />
	{/if}
</div>
