<script lang="ts">
	import type { EventPlanningContractFormState } from '$lib/state/v2/eventPlanningContractFormState.svelte';
	import FormSection from '$lib/components/FormSection.svelte';
	import TextField from '$lib/components/TextField.svelte';

	interface Props {
		formState: EventPlanningContractFormState;
	}

	let { formState }: Props = $props();
</script>

<FormSection title="Setup & Execution">
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<TextField
			id="technicalSetupDate"
			label="Technical Setup Date"
			type="date"
			bind:value={formState.technicalSetupDate}
			required
		/>

		<TextField
			id="eventExecutionDate"
			label="Event Execution Date"
			type="date"
			bind:value={formState.eventExecutionDate}
			required
		/>

		<TextField
			id="setupCommencementTime"
			label="Setup Commencement Time"
			type="time"
			bind:value={formState.setupCommencementTime}
			required
		/>

		<TextField
			id="eventExecutionDuration"
			label="Event Execution Duration"
			bind:value={formState.eventExecutionDuration}
			required
			placeholder="8 hours, 2 days, etc."
		/>
	</div>
</FormSection>
