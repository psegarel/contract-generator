<script lang="ts">
	import type { EventPlanningContractFormState } from '$lib/state/v2/eventPlanningContractFormState.svelte';
	import TextField from '$lib/components/TextField.svelte';

	interface Props {
		formState: EventPlanningContractFormState;
	}

	let { formState }: Props = $props();
</script>

<div class="bg-white p-6 rounded-lg border border-gray-200">
	<h3 class="text-lg font-semibold text-gray-900 mb-4">Setup & Execution</h3>
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
</div>
