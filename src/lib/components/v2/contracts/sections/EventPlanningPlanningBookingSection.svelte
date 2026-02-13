<script lang="ts">
	import type { EventPlanningContractFormState } from '$lib/state/v2/eventPlanningContractFormState.svelte';
	import TextField from '$lib/components/TextField.svelte';

	interface Props {
		formState: EventPlanningContractFormState;
	}

	let { formState }: Props = $props();
</script>

<div class="bg-white p-6 rounded-lg border border-gray-200">
	<h3 class="text-lg font-semibold text-gray-900 mb-4">Planning & Booking</h3>
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<TextField
			id="planningMeetingDays"
			label="Planning Meeting Days"
			type="number"
			bind:value={formState.planningMeetingDays}
			min="1"
			step="1"
			required
			placeholder="7"
		/>

		<TextField
			id="performerBookingDeadline"
			label="Performer Booking Deadline"
			type="date"
			bind:value={formState.performerBookingDeadline}
			required
		/>
	</div>
</div>
