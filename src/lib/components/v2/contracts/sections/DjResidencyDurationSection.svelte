<script lang="ts">
	import TextField from '$lib/components/TextField.svelte';
	import FormSection from '$lib/components/FormSection.svelte';
	import { DjResidencyContractFormState } from '$lib/state/v2/djResidencyContractFormState.svelte';

	interface Props {
		formState: DjResidencyContractFormState;
		onStartDateChange: () => void;
		onDurationChange: () => void;
	}

	let { formState, onStartDateChange, onDurationChange }: Props = $props();
</script>

<FormSection title="Contract Duration">
	<div class="grid gap-6 grid-cols-1 md:grid-cols-3">
		<TextField
			id="contractStartDate"
			label="Start Date"
			type="date"
			bind:value={formState.contractStartDate}
			onchange={onStartDateChange}
			required
		/>
		<TextField
			id="contractDurationMonths"
			label="Duration (months)"
			type="number"
			bind:value={formState.contractDurationMonths}
			onchange={onDurationChange}
			min="1"
			max="24"
			required
		/>
		<TextField
			id="contractEndDate"
			label="End Date"
			type="date"
			bind:value={formState.contractEndDate}
			readonly
			class="[&_input]:bg-muted"
		/>
	</div>
</FormSection>
