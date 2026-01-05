<script lang="ts">
	import { goto } from '$app/navigation';
	import EventForm from '$lib/components/v2/events/EventForm.svelte';

	function handleSuccess(eventId: string) {
		// Navigate to the event detail page
		goto(`/v2/events/${eventId}`);
	}

	function handleCancel() {
		// Navigate back to events list
		goto('/v2/events');
	}
</script>

<div class="container mx-auto px-4 py-8 max-w-4xl">
	<div class="mb-6">
		<h1 class="text-3xl font-bold text-gray-900">Create New Event</h1>
		<p class="text-gray-600 mt-2">Add a new event to organize contracts and track financial details.</p>
	</div>

	<EventForm onSuccess={handleSuccess} onCancel={handleCancel} />
</div>
