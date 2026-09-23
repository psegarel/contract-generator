<script lang="ts">
	import type { EquipmentRentalOneOffContractFormState } from '$lib/state/v2/equipmentRentalOneOffContractFormState.svelte';
	import TextField from '$lib/components/TextField.svelte';
	import FormSection from '$lib/components/FormSection.svelte';

	interface Props {
		formState: EquipmentRentalOneOffContractFormState;
	}

	let { formState }: Props = $props();
</script>

<FormSection title="Cancellation Terms">
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<TextField
			id="cancellationTier1Days"
			label="Tier 1: Cancel before (days)"
			type="number"
			bind:value={formState.cancellationTier1Days}
			min="1"
			helperText="Cancel this many+ days before event"
		/>
		<TextField
			id="cancellationTier1Percent"
			label="Tier 1: Fee owed (%)"
			type="number"
			bind:value={formState.cancellationTier1Percent}
			min="0"
			max="100"
		/>
		<TextField
			id="cancellationTier2Days"
			label="Tier 2: Cancel within (days)"
			type="number"
			bind:value={formState.cancellationTier2Days}
			min="1"
			helperText="Cancel within this many days of event"
		/>
		<TextField
			id="cancellationTier2Percent"
			label="Tier 2: Fee owed (%)"
			type="number"
			bind:value={formState.cancellationTier2Percent}
			min="0"
			max="100"
		/>
	</div>
</FormSection>
