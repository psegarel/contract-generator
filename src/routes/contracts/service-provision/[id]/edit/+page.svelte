<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';
	import ServiceProvisionForm from '$lib/components/v2/contracts/ServiceProvisionForm.svelte';

	let { data }: { data: PageData } = $props();

	function handleSuccess() {
		goto(resolve('/contracts/service-provision/list'));
	}

	function handleCancel() {
		goto(resolve('/contracts/service-provision/list'));
	}
</script>

<div class="container mx-auto px-4 py-8 max-w-6xl">
	<div class="mb-6">
		<h1 class="text-3xl font-bold text-foreground">Edit Service Provision Contract</h1>
		<p class="text-muted-foreground mt-2">
			Editing contract #{data.contract.contractNumber}
		</p>
	</div>

	<ServiceProvisionForm
		contract={data.contract}
		onSuccess={handleSuccess}
		onCancel={handleCancel}
	/>
</div>
