<script lang="ts">
	import type { EquipmentRentalOneOffContractFormState } from '$lib/state/v2/equipmentRentalOneOffContractFormState.svelte';
	import TextField from '$lib/components/TextField.svelte';
	import FormSection from '$lib/components/FormSection.svelte';

	interface Props {
		formState: EquipmentRentalOneOffContractFormState;
	}

	let { formState }: Props = $props();
</script>

<FormSection title="Financial (all amounts NET of VAT)">
	<div class="grid gap-4 grid-cols-1 md:grid-cols-3">
		<TextField
			id="contractValue"
			label="Rental Fee (VND, net)"
			type="number"
			bind:value={formState.contractValue}
			required
			min="0"
			helperText="= contractValue"
		/>
		<TextField
			id="deposit"
			label="Deposit (VND, net)"
			type="number"
			bind:value={formState.deposit}
			min="0"
		/>
		<TextField
			id="vatRate"
			label="VAT Rate (%)"
			type="number"
			bind:value={formState.vatRate}
			min="0"
			max="100"
		/>
		<TextField
			id="replacementValue"
			label="Replacement Value (VND, net)"
			type="number"
			bind:value={formState.replacementValue}
			min="0"
			helperText="Total replacement value of equipment"
		/>
	</div>
</FormSection>
