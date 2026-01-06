<script lang="ts">
	import { eventPlanningContractState } from '$lib/state/v2';
	import { ContractsList } from '$lib/components/v2/contracts';
	import { onMount } from 'svelte';

	onMount(async () => {
		await eventPlanningContractState.init();
	});

	let eventContracts = $derived(eventPlanningContractState.contracts);
</script>

<div class="container mx-auto py-8">
	<ContractsList contracts={eventContracts} title="Event Planning Contracts" />
</div>
