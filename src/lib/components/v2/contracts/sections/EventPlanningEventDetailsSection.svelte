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
		<div class="col-span-full">
			<TextField
				id="eventVenue"
				label="Event Venue"
				bind:value={formState.eventVenue}
				required
				placeholder="Grand Ballroom, 123 Main St"
			/>
		</div>

		<div>
			<label for="eventDate" class="block text-sm font-medium text-gray-700 mb-1">
				Event Date <span class="text-red-500">*</span>
			</label>
			<input
				id="eventDate"
				type="date"
				bind:value={formState.eventDate}
				required
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
			/>
		</div>

		<div>
			<TextField
				id="eventDuration"
				label="Event Duration"
				bind:value={formState.eventDuration}
				placeholder="4 hours, 1 day, etc."
			/>
		</div>

		<div class="col-span-full">
			<TextField
				id="expectedAttendance"
				label="Expected Attendance"
				bind:value={formState.expectedAttendance}
				placeholder="200 guests"
			/>
		</div>
	</div>
</div>
