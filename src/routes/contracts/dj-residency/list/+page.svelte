<script lang="ts">
	import { djResidencyContractState } from '$lib/state/v2';
	import { ContractsList } from '$lib/components/v2/contracts';
	import { onMount } from 'svelte';

	onMount(() => {
		djResidencyContractState.init();
	});

	let djResidencyContracts = $derived(djResidencyContractState.contracts);
</script>

<div class="container mx-auto py-8">
	<ContractsList contracts={djResidencyContracts} title="DJ Residency Contracts" />
</div>
