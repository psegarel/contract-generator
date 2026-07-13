<script lang="ts">
	import { equipmentRentalOneOffContractState } from '$lib/state/v2';
	import { ContractsList } from '$lib/components/v2/contracts';
	import { onMount } from 'svelte';

	onMount(() => {
		equipmentRentalOneOffContractState.init();
	});

	let contracts = $derived(equipmentRentalOneOffContractState.contracts);
</script>

<div class="container mx-auto py-8">
	<ContractsList contracts={contracts} title="Equipment Rental (One-Off) Contracts" />
</div>
