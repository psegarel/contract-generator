<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import EquipmentRentalOneOffForm from '$lib/components/v2/contracts/EquipmentRentalOneOffForm.svelte';

	function handleSuccess(contractId: string) {
		goto(resolve(`/contracts/equipment-rental-oneoff/${contractId}`));
	}

	function handleCancel() {
		goto(resolve('/contracts'));
	}
</script>

<div class="container mx-auto px-4 py-8 max-w-6xl">
	<div class="mb-6">
		<h1 class="text-3xl font-bold text-foreground">Create Equipment Rental (One-Off)</h1>
		<p class="text-muted-foreground mt-2">
			Create a one-off equipment rental contract referencing an external quotation.
		</p>
	</div>

	<EquipmentRentalOneOffForm onSuccess={handleSuccess} onCancel={handleCancel} />
</div>
