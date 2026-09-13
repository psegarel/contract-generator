<script lang="ts">
	import TextField from '$lib/components/TextField.svelte';
	import TextareaField from '$lib/components/TextareaField.svelte';

	interface InlineEventFormState {
		newEventName: string;
		newEventDate: string;
		newEventType: string;
		newEventDescription: string;
		newEventLocationAddress: string;
		newEventLocationName: string;
		newEventExpectedAttendance: number | null;
		isCreatingEvent: boolean;
	}

	interface Props {
		formState: InlineEventFormState;
		onCancel: () => void;
		onCreate: () => Promise<void>;
	}

	let { formState, onCancel, onCreate }: Props = $props();
</script>

<div class="bg-blue-50 border border-blue-200 p-6 rounded-lg space-y-6">
	<h3 class="text-lg font-semibold text-gray-900 mb-4">Create New Event</h3>

	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<div class="col-span-full">
			<TextField
				id="newEventName"
				label="Event Name"
				bind:value={formState.newEventName}
				placeholder="e.g., ABC Corp Annual Gala 2026"
				required
			/>
		</div>

		<div>
			<TextField
				id="newEventDate"
				label="Event Date"
				type="date"
				bind:value={formState.newEventDate}
				required
			/>
		</div>

		<div>
			<TextField
				id="newEventType"
				label="Event Type"
				bind:value={formState.newEventType}
				placeholder="Corporate Event, Wedding, Concert"
			/>
		</div>

		<div class="col-span-full">
			<TextField
				id="newEventLocationAddress"
				label="Location Address"
				bind:value={formState.newEventLocationAddress}
				placeholder="123 Main St, Ho Chi Minh City"
				required
			/>
		</div>

		<div>
			<TextField
				id="newEventLocationName"
				label="Location Name"
				bind:value={formState.newEventLocationName}
				placeholder="Grand Ballroom"
			/>
		</div>

		<div>
			<label for="newEventExpectedAttendance" class="block text-sm font-medium text-gray-700 mb-1">
				Expected Attendance
			</label>
			<input
				id="newEventExpectedAttendance"
				type="number"
				bind:value={formState.newEventExpectedAttendance}
				min="0"
				placeholder="100"
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
			/>
		</div>

		<div class="col-span-full">
			<TextareaField
				id="newEventDescription"
				label="Description"
				bind:value={formState.newEventDescription}
				rows={3}
				placeholder="Brief description of the event..."
			/>
		</div>
	</div>

	<div class="flex gap-3 justify-end pt-4 border-t border-blue-300">
		<button
			type="button"
			onclick={onCancel}
			class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
		>
			Cancel
		</button>
		<button
			type="button"
			onclick={onCreate}
			disabled={formState.isCreatingEvent}
			class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
		>
			{formState.isCreatingEvent ? 'Creating...' : 'Create Event'}
		</button>
	</div>
</div>
