<script lang="ts">
	import type { EquipmentRentalOneOffContractFormState } from '$lib/state/v2/equipmentRentalOneOffContractFormState.svelte';
	import TextField from '$lib/components/TextField.svelte';
	import FormSection from '$lib/components/FormSection.svelte';

	interface Props {
		formState: EquipmentRentalOneOffContractFormState;
	}

	let { formState }: Props = $props();
</script>

<FormSection title="Payment Terms">
	<div class="grid gap-4 grid-cols-1 md:grid-cols-3">
		<TextField
			id="balancePaymentDays"
			label="Balance Due (days after event)"
			type="number"
			bind:value={formState.balancePaymentDays}
			min="1"
		/>
		<TextField
			id="latePaymentPenaltyRate"
			label="Late Interest (%/day)"
			type="number"
			bind:value={formState.latePaymentPenaltyRate}
			min="0"
			step="0.01"
		/>
		<TextField
			id="latePaymentPenaltyCap"
			label="Late Interest Cap (%)"
			type="number"
			bind:value={formState.latePaymentPenaltyCap}
			min="0"
		/>
	</div>
</FormSection>
