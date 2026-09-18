<script lang="ts">
	import type { EventPlanningContractFormState } from '$lib/state/v2/eventPlanningContractFormState.svelte';
	import FormSection from '$lib/components/FormSection.svelte';
	import TextField from '$lib/components/TextField.svelte';

	interface Props {
		formState: EventPlanningContractFormState;
	}

	let { formState }: Props = $props();
</script>

<FormSection title="Event Details">
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<TextField
			class="col-span-full"
			id="eventVenue"
			label="Event Venue"
			bind:value={formState.eventVenue}
			required
			placeholder="Grand Ballroom, 123 Main St"
		/>

		<TextField
			id="eventDate"
			label="Event Date"
			type="date"
			bind:value={formState.eventDate}
			required
		/>

		<TextField
			id="eventDuration"
			label="Event Duration"
			bind:value={formState.eventDuration}
			placeholder="4 hours, 1 day, etc."
		/>

		<TextField
			class="col-span-full"
			id="expectedAttendance"
			label="Expected Attendance"
			bind:value={formState.expectedAttendance}
			placeholder="200 guests"
		/>
	</div>
</FormSection>
