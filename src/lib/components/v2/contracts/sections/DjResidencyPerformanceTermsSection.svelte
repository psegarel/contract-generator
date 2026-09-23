<script lang="ts">
	import TextField from '$lib/components/TextField.svelte';
	import FormSection from '$lib/components/FormSection.svelte';
	import { DjResidencyContractFormState } from '$lib/state/v2/djResidencyContractFormState.svelte';

	interface Props {
		formState: DjResidencyContractFormState;
	}

	let { formState }: Props = $props();
</script>

<FormSection title="Performance Terms">
	<div class="grid gap-6 grid-cols-1 md:grid-cols-2">
		<TextField
			id="performanceDays"
			label="Performance Days"
			bind:value={formState.performanceDays}
			placeholder="e.g., Saturday and Sunday"
			required
		/>
		<TextField
			id="numberOfSetsPerDay"
			label="Sets per Day"
			type="number"
			bind:value={formState.numberOfSetsPerDay}
			min="1"
			max="10"
			required
		/>
	</div>
</FormSection>
