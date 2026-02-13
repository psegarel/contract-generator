<script lang="ts">
	import type { EventPlanningContractFormState } from '$lib/state/v2/eventPlanningContractFormState.svelte';
	import TextField from '$lib/components/TextField.svelte';

	interface Props {
		formState: EventPlanningContractFormState;
	}

	let { formState }: Props = $props();
</script>

<div class="bg-white p-6 rounded-lg border border-gray-200">
	<h3 class="text-lg font-semibold text-gray-900 mb-4">Event Details</h3>
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
</div>
