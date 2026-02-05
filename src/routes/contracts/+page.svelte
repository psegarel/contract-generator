<script lang="ts">
	import { goto } from '$app/navigation';
	import ContractTypeSelector from '$lib/components/v2/contracts/ContractTypeSelector.svelte';
	import type { ContractType } from '$lib/types/v2';

	function handleContractTypeSelect(type: ContractType) {
		// Route to the appropriate contract creation page
		const routes: Record<ContractType, string> = {
			'venue-rental': '/contracts/venue-rental',
			'performer-booking': '/contracts/performer-booking',
			'equipment-rental': '/contracts/equipment-rental',
			'service-provision': '/contracts/service-provision',
			'event-planning': '/contracts/event-planning',
			subcontractor: '/contracts/subcontractor',
			'client-service': '/contracts/client-service',
			'dj-residency': '/contracts/dj-residency'
		};

		const route = routes[type];
		if (route) {
			goto(route);
		}
	}
</script>

<div class="container mx-auto px-4 py-8 max-w-6xl">
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900">Create Contract</h1>
		<p class="text-gray-600 mt-2">Select the type of contract you want to create.</p>
	</div>

	<ContractTypeSelector onSelect={handleContractTypeSelect} />
</div>
