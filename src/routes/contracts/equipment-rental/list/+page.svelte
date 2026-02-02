<script lang="ts">
	import { equipmentRentalContractState } from '$lib/state/v2';
	import { ContractsList } from '$lib/components/v2/contracts';
	import { onMount } from 'svelte';

	onMount(() => {
		equipmentRentalContractState.init();
	});

	let equipmentContracts = $derived(equipmentRentalContractState.contracts);
</script>

<div class="container mx-auto py-8">
	<ContractsList contracts={equipmentContracts} title="Equipment Rental Contracts" />
</div>
