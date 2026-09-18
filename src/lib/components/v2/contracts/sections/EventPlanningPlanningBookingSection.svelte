<script lang="ts">
	import type { EventPlanningContractFormState } from '$lib/state/v2/eventPlanningContractFormState.svelte';
	import FormSection from '$lib/components/FormSection.svelte';
	import TextField from '$lib/components/TextField.svelte';

	interface Props {
		formState: EventPlanningContractFormState;
	}

	let { formState }: Props = $props();
</script>

<FormSection title="Planning & Booking">
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
</FormSection>
