<script lang="ts">
	import type { EquipmentRentalContractFormState } from '$lib/state/v2/equipmentRentalContractFormState.svelte';
	import TextField from '$lib/components/TextField.svelte';
	import FormSection from '$lib/components/FormSection.svelte';

	interface Props {
		formState: EquipmentRentalContractFormState;
	}

	let { formState }: Props = $props();
</script>

<FormSection title="Rental Period">
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
</FormSection>
