<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import EquipmentRentalForm from '$lib/components/v2/contracts/EquipmentRentalForm.svelte';

	function handleSuccess(contractId: string) {
		goto(resolve(`/contracts/equipment-rental/${contractId}`));
	}

	function handleCancel() {
		goto(resolve('/contracts'));
	}
</script>

<div class="container mx-auto px-4 py-8 max-w-6xl">
	<div class="mb-6">
		<h1 class="text-3xl font-bold text-foreground">Create Equipment Rental Contract</h1>
		<p class="text-muted-foreground mt-2">
			Create a contract for renting AV equipment to or from a counterparty.
		</p>
	</div>

	<EquipmentRentalForm onSuccess={handleSuccess} onCancel={handleCancel} />
</div>
