<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import EventPlanningForm from '$lib/components/v2/contracts/EventPlanningForm.svelte';

	let { data }: { data: PageData } = $props();

	function handleSuccess() {
		goto('/v2/contracts');
	}

	function handleCancel() {
		goto('/v2/contracts');
	}
</script>

<div class="container mx-auto px-4 py-8 max-w-6xl">
	<div class="mb-6">
		<h1 class="text-3xl font-bold text-gray-900">Edit Event Planning Contract</h1>
		<p class="text-gray-600 mt-2">
			Editing contract #{data.contract.contractNumber}
		</p>
	</div>

	<EventPlanningForm contract={data.contract} onSuccess={handleSuccess} onCancel={handleCancel} />
</div>
