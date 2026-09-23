<script lang="ts">
	import SelectField from '$lib/components/SelectField.svelte';
	import FormSection from '$lib/components/FormSection.svelte';
	import { DjResidencyContractFormState } from '$lib/state/v2/djResidencyContractFormState.svelte';

	interface Props {
		formState: DjResidencyContractFormState;
	}

	let { formState }: Props = $props();
</script>

<FormSection title="Status">
	<div class="grid gap-6 grid-cols-1 md:grid-cols-2">
		<SelectField
			id="residencyStatus"
			label="Residency Status"
			bind:value={formState.residencyStatus}
			required
		>
			<option value="active">Active</option>
			<option value="completed">Completed</option>
			<option value="terminated">Terminated</option>
		</SelectField>
	</div>
</FormSection>
