<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import EquipmentRentalForm from '$lib/components/v2/contracts/EquipmentRentalForm.svelte';

	let { data }: { data: PageData } = $props();

	function handleSuccess(contractId: string) {
		goto(`/contracts/equipment-rental/${contractId}`);
	}

	function handleCancel() {
		goto('/contracts');
	}
</script>

<div class="container mx-auto px-4 py-8 max-w-6xl">
	<div class="mb-6">
		<h1 class="text-3xl font-bold text-gray-900">Create Equipment Rental Contract</h1>
		<p class="text-gray-600 mt-2">
			Create a contract for renting AV equipment to or from a counterparty.
		</p>
	</div>

	<EquipmentRentalForm onSuccess={handleSuccess} onCancel={handleCancel} />
</div>
