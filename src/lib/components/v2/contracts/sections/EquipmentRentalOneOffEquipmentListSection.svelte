<script lang="ts">
	import type { EquipmentRentalOneOffContractFormState } from '$lib/state/v2/equipmentRentalOneOffContractFormState.svelte';
	import TextareaField from '$lib/components/TextareaField.svelte';
	import FormSection from '$lib/components/FormSection.svelte';

	interface Props {
		formState: EquipmentRentalOneOffContractFormState;
	}

	let { formState }: Props = $props();
</script>

<FormSection title="Equipment List (Annex 1)">
	<TextareaField
		id="equipmentList"
		label="Equipment items"
		bind:value={formState.equipmentList}
		rows={6}
		required
		placeholder="List the equipment items that will appear in Annex 1..."
		helperText="This text is inserted into the Annex 1 section of the contract"
	/>
</FormSection>
