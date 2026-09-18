<script lang="ts">
	import TextField from '$lib/components/TextField.svelte';
	import TextareaField from '$lib/components/TextareaField.svelte';
	import { Button } from '$lib/components/ui/button';

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

<div class="bg-primary/5 border border-primary/20 p-6 rounded-lg space-y-6">
	<h3 class="text-lg font-semibold text-foreground mb-4">Create New Event</h3>

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

		<TextField
			id="newEventDate"
			label="Event Date"
			type="date"
			bind:value={formState.newEventDate}
			required
		/>

		<TextField
			id="newEventType"
			label="Event Type"
			bind:value={formState.newEventType}
			placeholder="Corporate Event, Wedding, Concert"
		/>

		<div class="col-span-full">
			<TextField
				id="newEventLocationAddress"
				label="Location Address"
				bind:value={formState.newEventLocationAddress}
				placeholder="123 Main St, Ho Chi Minh City"
				required
			/>
		</div>

		<TextField
			id="newEventLocationName"
			label="Location Name"
			bind:value={formState.newEventLocationName}
			placeholder="Grand Ballroom"
		/>

		<TextField
			id="newEventExpectedAttendance"
			label="Expected Attendance"
			type="number"
			value={formState.newEventExpectedAttendance ?? ''}
			oninput={(e) => { const v = (e.target as HTMLInputElement).value; formState.newEventExpectedAttendance = v ? Number(v) : null; }}
			min="0"
			placeholder="100"
		/>

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

	<div class="flex gap-3 justify-end pt-4 border-t border-primary/30">
		<Button type="button" variant="outline" onclick={onCancel}>
			Cancel
		</Button>
		<Button
			type="button"
			onclick={onCreate}
			disabled={formState.isCreatingEvent}
		>
			{formState.isCreatingEvent ? 'Creating...' : 'Create Event'}
		</Button>
	</div>
</div>
