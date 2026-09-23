<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import DjResidencyForm from '$lib/components/v2/contracts/DjResidencyForm.svelte';

	let { data }: { data: PageData } = $props();

	function handleSuccess(contractId: string) {
		goto(resolve(`/contracts/dj-residency/${contractId}`));
	}

	function handleCancel() {
		goto(resolve(`/contracts/dj-residency/${data.contract.id}`));
	}
</script>

<div class="container mx-auto px-4 py-8 max-w-6xl">
	<div class="mb-6">
		<h1 class="text-3xl font-bold text-foreground">Edit DJ Residency Contract</h1>
		<p class="text-muted-foreground mt-2">
			Edit contract #{data.contract.contractNumber}
		</p>
	</div>

	<DjResidencyForm contract={data.contract} onSuccess={handleSuccess} onCancel={handleCancel} />
</div>
