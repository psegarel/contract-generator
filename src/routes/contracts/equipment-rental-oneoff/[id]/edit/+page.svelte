<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import EquipmentRentalOneOffForm from '$lib/components/v2/contracts/EquipmentRentalOneOffForm.svelte';

	let { data }: { data: PageData } = $props();

	function handleSuccess() {
		goto(`/contracts/equipment-rental-oneoff/${data.contract.id}`);
	}

	function handleCancel() {
		goto(`/contracts/equipment-rental-oneoff/${data.contract.id}`);
	}
</script>

<div class="container mx-auto px-4 py-8 max-w-6xl">
	<div class="mb-6">
		<h1 class="text-3xl font-bold text-foreground">Edit Equipment Rental (One-Off)</h1>
		<p class="text-muted-foreground mt-2">
			Editing contract #{data.contract.contractNumber}
		</p>
	</div>

	<EquipmentRentalOneOffForm
		contract={data.contract}
		onSuccess={handleSuccess}
		onCancel={handleCancel}
	/>
</div>
