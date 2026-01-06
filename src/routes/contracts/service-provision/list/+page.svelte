<script lang="ts">
	import { serviceProvisionContractState } from '$lib/state/v2';
	import { ContractsList } from '$lib/components/v2/contracts';
	import { onMount } from 'svelte';

	onMount(async () => {
		await serviceProvisionContractState.init();
	});

	let serviceContracts = $derived(serviceProvisionContractState.contracts);
</script>

<div class="container mx-auto py-8">
	<ContractsList contracts={serviceContracts} title="Service Contracts" />
</div>
