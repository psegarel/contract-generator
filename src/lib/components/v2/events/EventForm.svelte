<script lang="ts">
	import { onMount } from 'svelte';
	import type { Event } from '$lib/types/v2';
	import { authState } from '$lib/state/auth.svelte';
	import { counterpartyState } from '$lib/state/v2';
	import { EventFormState } from '$lib/state/v2/eventFormState.svelte';
	import { logger } from '$lib/utils/logger';
	import { Button } from '$lib/components/ui/button';
	import FormMessage from '$lib/components/FormMessage.svelte';
	import EventBasicsSection from './sections/EventBasicsSection.svelte';
	import EventLocationSection from './sections/EventLocationSection.svelte';
	import EventScheduleSection from './sections/EventScheduleSection.svelte';
	import EventNotesSection from './sections/EventNotesSection.svelte';
	import { saveEventForm } from '$lib/forms/events/event';

	interface Props {
		event?: Event | null;
		onSuccess?: (eventId: string) => void;
		onCancel?: () => void;
	}

	let { event = null, onSuccess, onCancel }: Props = $props();
	const formState = new EventFormState();

	onMount(() => {
		counterpartyState.init();
		return () => counterpartyState.destroy();
	});

	const venues = $derived(
		counterpartyState.clients.filter((client) => client.clientType === 'company')
	);

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
			const eventId = await saveEventForm({
				values: formState,
				ownerUid: authState.user.uid,
				event
			});

			onSuccess?.(eventId);
		} catch (error) {
			logger.error('Error saving event:', error);
			formState.error = (error as Error).message;
		} finally {
			formState.isSubmitting = false;
		}
	}
</script>

<form
	onsubmit={(event) => {
		event.preventDefault();
		handleSubmit();
	}}
	class="space-y-6"
>
	{#if formState.error}
		<FormMessage message={formState.error} />
	{/if}

	<EventBasicsSection {formState} />
	<EventLocationSection {formState} {venues} />
	<EventScheduleSection {formState} />
	<EventNotesSection {formState} />

	<div class="flex justify-end gap-3">
		{#if onCancel}
			<Button type="button" variant="outline" onclick={onCancel} disabled={formState.isSubmitting}>
				Cancel
			</Button>
		{/if}
		<Button type="submit" disabled={formState.isSubmitting} variant="dark">
			{formState.isSubmitting ? 'Saving...' : event ? 'Update Event' : 'Create Event'}
		</Button>
	</div>
</form>
