<script lang="ts">
	import type { EventPlanningContractFormState } from '$lib/state/v2/eventPlanningContractFormState.svelte';
	import FormSection from '$lib/components/FormSection.svelte';
	import TextField from '$lib/components/TextField.svelte';

	interface Props {
		formState: EventPlanningContractFormState;
	}

	let { formState }: Props = $props();
</script>

<FormSection title="Breakdown">
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<TextField
			class="col-span-full"
			id="breakdownCompletionDateTime"
			label="Breakdown Completion Date/Time"
			type="datetime-local"
			bind:value={formState.breakdownCompletionDateTime}
			required
		/>
	</div>
</FormSection>
