<script lang="ts">
	import TextField from '$lib/components/TextField.svelte';
	import FormSection from '$lib/components/FormSection.svelte';
	import type { EventFormState } from '$lib/state/v2/eventFormState.svelte';

	let { formState }: { formState: EventFormState } = $props();
</script>

<FormSection title="Date & Time">
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
		<TextField
			id="eventDate"
			label="Event Date"
			type="date"
			bind:value={formState.eventDate}
			required
		/>

		<TextField
			id="expectedAttendance"
			label="Expected Attendance"
			type="number"
			bind:value={formState.expectedAttendance}
			min="0"
			placeholder="100"
		/>

		<TextField id="startTime" label="Start Time" type="time" bind:value={formState.startTime} />
		<TextField id="endTime" label="End Time" type="time" bind:value={formState.endTime} />
		<TextField
			id="setupDateTime"
			label="Setup Date/Time"
			type="datetime-local"
			bind:value={formState.setupDateTime}
		/>
		<TextField
			id="teardownDateTime"
			label="Teardown Date/Time"
			type="datetime-local"
			bind:value={formState.teardownDateTime}
		/>
	</div>
</FormSection>
