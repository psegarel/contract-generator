<script lang="ts">
	import type { EventPlanningContractFormState } from '$lib/state/v2/eventPlanningContractFormState.svelte';

	interface Props {
		formState: EventPlanningContractFormState;
	}

	let { formState }: Props = $props();
</script>

<div class="bg-white p-6 rounded-lg border border-gray-200">
	<h3 class="text-lg font-semibold text-gray-900 mb-4">Planning & Booking</h3>
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<div>
			<label for="planningMeetingDays" class="block text-sm font-medium text-gray-700 mb-1">
				Planning Meeting Days <span class="text-red-500">*</span>
			</label>
			<input
				id="planningMeetingDays"
				type="number"
				bind:value={formState.planningMeetingDays}
				min="1"
				step="1"
				required
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				placeholder="7"
			/>
		</div>

		<div>
			<label for="performerBookingDeadline" class="block text-sm font-medium text-gray-700 mb-1">
				Performer Booking Deadline <span class="text-red-500">*</span>
			</label>
			<input
				id="performerBookingDeadline"
				type="date"
				bind:value={formState.performerBookingDeadline}
				required
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
			/>
		</div>
	</div>
</div>
