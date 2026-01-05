<script lang="ts">
	import { goto } from '$app/navigation';
	import EventPlanningForm from '$lib/components/v2/contracts/EventPlanningForm.svelte';

	function handleSuccess(contractId: string) {
		goto('/contracts/event-planning/list');
	}

	function handleCancel() {
		goto('/contracts/event-planning/list');
	}
</script>

<div class="container mx-auto px-4 py-8 max-w-6xl">
	<div class="mb-6">
		<h1 class="text-3xl font-bold text-gray-900">Create Event Planning Contract</h1>
		<p class="text-gray-600 mt-2">Create a contract for organizing a full event for a client.</p>
	</div>

	<EventPlanningForm onSuccess={handleSuccess} onCancel={handleCancel} />
</div>
