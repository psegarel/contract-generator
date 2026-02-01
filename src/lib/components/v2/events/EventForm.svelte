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
	const venues = $derived(counterpartyState.counterparties.filter((c) => c.type === 'venue'));

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
		<div class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
			{formState.error}
		</div>
	{/if}

	<!-- Basic Information -->
	<div class="bg-white p-6 rounded-lg border border-gray-200">
		<h3 class="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
		<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
			<div class="col-span-full">
				<label for="name" class="block text-sm font-medium text-gray-700 mb-1">
					Event Name <span class="text-red-500">*</span>
				</label>
				<input
					id="name"
					type="text"
					bind:value={formState.name}
					required
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
					placeholder="ABC Corp Annual Gala 2026"
				/>
			</div>

			<div>
				<label for="eventType" class="block text-sm font-medium text-gray-700 mb-1">
					Event Type
				</label>
				<input
					id="eventType"
					type="text"
					bind:value={formState.eventType}
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
					placeholder="Corporate Event, Wedding, Concert"
				/>
			</div>

			<div>
				<label for="status" class="block text-sm font-medium text-gray-700 mb-1">
					Status <span class="text-red-500">*</span>
				</label>
				<select
					id="status"
					bind:value={formState.status}
					required
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				>
					<option value="planning">Planning</option>
					<option value="confirmed">Confirmed</option>
					<option value="in-progress">In Progress</option>
					<option value="completed">Completed</option>
					<option value="cancelled">Cancelled</option>
				</select>
			</div>

			<div class="col-span-full">
				<label for="description" class="block text-sm font-medium text-gray-700 mb-1">
					Description
				</label>
				<textarea
					id="description"
					bind:value={formState.description}
					rows="3"
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
					placeholder="Brief description of the event..."
				></textarea>
			</div>
		</div>
	</div>

	<!-- Location Information -->
	<div class="bg-white p-6 rounded-lg border border-gray-200">
		<h3 class="text-lg font-semibold text-gray-900 mb-4">Location</h3>
		<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
			<div class="col-span-full">
				<label for="locationAddress" class="block text-sm font-medium text-gray-700 mb-1">
					Location Address <span class="text-red-500">*</span>
				</label>
				<input
					id="locationAddress"
					type="text"
					bind:value={formState.locationAddress}
					required
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
					placeholder="123 Main St, Ho Chi Minh City"
				/>
			</div>

			<div>
				<label for="locationName" class="block text-sm font-medium text-gray-700 mb-1">
					Location Name
				</label>
				<input
					id="locationName"
					type="text"
					bind:value={formState.locationName}
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
					placeholder="Grand Ballroom"
				/>
			</div>

			<div>
				<label for="venueCounterpartyId" class="block text-sm font-medium text-gray-700 mb-1">
					Venue Counterparty (if contracted)
				</label>
				<select
					id="venueCounterpartyId"
					bind:value={formState.venueCounterpartyId}
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				>
					<option value="">None (simple address)</option>
					{#each venues as venue (venue.id)}
						<option value={venue.id}>{venue.name}</option>
					{/each}
				</select>
			</div>
		</div>
	</div>

	<!-- Date & Time -->
	<div class="bg-white p-6 rounded-lg border border-gray-200">
		<h3 class="text-lg font-semibold text-gray-900 mb-4">Date & Time</h3>
		<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
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
				<label for="expectedAttendance" class="block text-sm font-medium text-gray-700 mb-1">
					Expected Attendance
				</label>
				<input
					id="expectedAttendance"
					type="number"
					bind:value={formState.expectedAttendance}
					min="0"
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
					placeholder="100"
				/>
			</div>

			<div>
				<label for="startTime" class="block text-sm font-medium text-gray-700 mb-1">
					Start Time
				</label>
				<input
					id="startTime"
					type="time"
					bind:value={formState.startTime}
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				/>
			</div>

			<div>
				<label for="endTime" class="block text-sm font-medium text-gray-700 mb-1">
					End Time
				</label>
				<input
					id="endTime"
					type="time"
					bind:value={formState.endTime}
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				/>
			</div>

			<div>
				<label for="setupDateTime" class="block text-sm font-medium text-gray-700 mb-1">
					Setup Date/Time
				</label>
				<input
					id="setupDateTime"
					type="datetime-local"
					bind:value={formState.setupDateTime}
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				/>
			</div>

			<div>
				<label for="teardownDateTime" class="block text-sm font-medium text-gray-700 mb-1">
					Teardown Date/Time
				</label>
				<input
					id="teardownDateTime"
					type="datetime-local"
					bind:value={formState.teardownDateTime}
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				/>
			</div>
		</div>
	</div>

	<!-- Notes -->
	<div class="bg-white p-6 rounded-lg border border-gray-200">
		<h3 class="text-lg font-semibold text-gray-900 mb-4">Internal Notes</h3>
		<textarea
			id="internalNotes"
			bind:value={formState.internalNotes}
			rows="4"
			class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
			placeholder="Internal notes for planning, coordination, etc..."
		></textarea>
	</div>

	<!-- Form Actions -->
	<div class="flex gap-3 justify-end">
		{#if onCancel}
			<button
				type="button"
				onclick={onCancel}
				disabled={formState.isSubmitting}
				class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
			>
				Cancel
			</button>
		{/if}
		<Button type="submit" disabled={formState.isSubmitting} variant="dark">
			{formState.isSubmitting ? 'Saving...' : event ? 'Update Event' : 'Create Event'}
		</Button>
	</div>
</form>
