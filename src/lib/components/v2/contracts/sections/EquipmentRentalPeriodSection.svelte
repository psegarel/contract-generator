<script lang="ts">
	import type { EquipmentRentalContractFormState } from '$lib/state/v2/equipmentRentalContractFormState.svelte';
	import TextField from '$lib/components/TextField.svelte';

	interface Props {
		formState: EquipmentRentalContractFormState;
	}

	let { formState }: Props = $props();
</script>

<div class="bg-white p-6 rounded-lg border border-gray-200">
	<h3 class="text-lg font-semibold text-gray-900 mb-4">Rental Period</h3>
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<TextField
			id="rentalStartDate"
			label="Rental Start Date"
			type="date"
			bind:value={formState.rentalStartDate}
			required
		/>
		<TextField
			id="rentalEndDate"
			label="Rental End Date"
			type="date"
			bind:value={formState.rentalEndDate}
			required
		/>
	</div>
</div>
