<script lang="ts">
	import type { Event, EventInput } from '$lib/types/v2';
	import { eventSchema } from '$lib/schemas/v2';
	import { saveEvent, updateEvent } from '$lib/utils/v2';
	import { authState } from '$lib/state/auth.svelte';
	import { counterpartyState } from '$lib/state/v2';
	import { EventFormState } from '$lib/state/v2/eventFormState.svelte';
	import { Button } from '$lib/components/ui/button';
	import { onMount } from 'svelte';
	import { logger } from '$lib/utils/logger';
	import FormSection from '$lib/components/FormSection.svelte';
	import TextField from '$lib/components/TextField.svelte';
	import TextareaField from '$lib/components/TextareaField.svelte';
	import SelectField from '$lib/components/SelectField.svelte';

	interface Props {
		event?: Event | null;
		onSuccess?: (eventId: string) => void;
		onCancel?: () => void;
	}

	let { event = null, onSuccess, onCancel }: Props = $props();

	// Initialize counterparty state for venue selection
	onMount(() => {
		counterpartyState.init();
		return () => {
			counterpartyState.destroy();
		};
	});

	// Get venue counterparties for selection
	const venues = $derived(counterpartyState.clients.filter((c) => c.clientType === 'company'));

	// Create form state instance
	const formState = new EventFormState();

	// Initialize form state from prop on mount
	onMount(() => {
		formState.init(event);
	});

	async function handleSubmit() {
		if (!authState.user) {
			formState.error = 'You must be logged in to create an event';
			return;
		}

		formState.isSubmitting = true;
		formState.error = null;

		try {
			const eventData: EventInput = {
				ownerUid: authState.user.uid,
				name: formState.name,
				eventType: formState.eventType || null,
				description: formState.description || null,
				locationAddress: formState.locationAddress,
				locationName: formState.locationName || null,
				venueCounterpartyId: formState.venueCounterpartyId || null,
				eventDate: formState.eventDate,
				startTime: formState.startTime || null,
				endTime: formState.endTime || null,
				setupDateTime: formState.setupDateTime || null,
				teardownDateTime: formState.teardownDateTime || null,
				expectedAttendance:
					typeof formState.expectedAttendance === 'number' ? formState.expectedAttendance : null,
				status: formState.status,
				internalNotes: formState.internalNotes || null
			};

			// Validate with schema
			const validationResult = eventSchema.safeParse(eventData);
			if (!validationResult.success) {
				formState.error = 'Validation error: ' + validationResult.error.issues[0].message;
				return;
			}

			let eventId: string;
			if (event) {
				await updateEvent(event.id, eventData);
				eventId = event.id;
			} else {
				eventId = await saveEvent(eventData);
			}

			if (onSuccess) {
				onSuccess(eventId);
			}
		} catch (e) {
			logger.error('Error saving event:', e);
			formState.error = (e as Error).message;
		} finally {
			formState.isSubmitting = false;
		}
	}
</script>

<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-6">
	<!-- Error message -->
	{#if formState.error}
		<div class="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
			{formState.error}
		</div>
	{/if}

	<!-- Basic Information -->
	<FormSection title="Basic Information">
		<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
			<div class="col-span-full">
				<TextField
					id="name"
					label="Event Name"
					bind:value={formState.name}
					required
					placeholder="ABC Corp Annual Gala 2026"
				/>
			</div>

			<TextField
				id="eventType"
				label="Event Type"
				bind:value={formState.eventType}
				placeholder="Corporate Event, Wedding, Concert"
			/>

			<SelectField
				id="status"
				label="Status"
				bind:value={formState.status}
				required
			>
				<option value="planning">Planning</option>
				<option value="confirmed">Confirmed</option>
				<option value="in-progress">In Progress</option>
				<option value="completed">Completed</option>
				<option value="cancelled">Cancelled</option>
			</SelectField>

			<div class="col-span-full">
				<TextareaField
					id="description"
					label="Description"
					bind:value={formState.description}
					rows={3}
					placeholder="Brief description of the event..."
				/>
			</div>
		</div>
	</FormSection>

	<!-- Location Information -->
	<FormSection title="Location">
		<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
			<div class="col-span-full">
				<TextField
					id="locationAddress"
					label="Location Address"
					bind:value={formState.locationAddress}
					required
					placeholder="123 Main St, Ho Chi Minh City"
				/>
			</div>

			<TextField
				id="locationName"
				label="Location Name"
				bind:value={formState.locationName}
				placeholder="Grand Ballroom"
			/>

			<SelectField
				id="venueCounterpartyId"
				label="Venue Counterparty (if contracted)"
				bind:value={formState.venueCounterpartyId}
			>
				<option value="">None (simple address)</option>
				{#each venues as venue (venue.id)}
					<option value={venue.id}>{venue.name}</option>
				{/each}
			</SelectField>
		</div>
	</FormSection>

	<!-- Date & Time -->
	<FormSection title="Date & Time">
		<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
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

			<TextField
				id="startTime"
				label="Start Time"
				type="time"
				bind:value={formState.startTime}
			/>

			<TextField
				id="endTime"
				label="End Time"
				type="time"
				bind:value={formState.endTime}
			/>

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

	<!-- Notes -->
	<FormSection title="Internal Notes">
		<TextareaField
			id="internalNotes"
			label="Internal Notes"
			bind:value={formState.internalNotes}
			rows={4}
			placeholder="Internal notes for planning, coordination, etc..."
		/>
	</FormSection>

	<!-- Form Actions -->
	<div class="flex gap-3 justify-end">
		{#if onCancel}
			<Button
				type="button"
				variant="outline"
				onclick={onCancel}
				disabled={formState.isSubmitting}
			>
				Cancel
			</Button>
		{/if}
		<Button type="submit" disabled={formState.isSubmitting} variant="dark">
			{formState.isSubmitting ? 'Saving...' : event ? 'Update Event' : 'Create Event'}
		</Button>
	</div>
</form>
