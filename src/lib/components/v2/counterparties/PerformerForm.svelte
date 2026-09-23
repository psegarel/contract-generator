<script lang="ts">
	import { onMount } from 'svelte';
	import type { PerformerContractor } from '$lib/types/v2';
	import { authState } from '$lib/state/auth.svelte';
	import { PerformerFormState } from '$lib/state/v2/performerFormState.svelte';
	import { logger } from '$lib/utils/logger';
	import FormMessage from '$lib/components/FormMessage.svelte';
	import CounterpartyNotesSection from './sections/CounterpartyNotesSection.svelte';
	import CounterpartyFormActions from './sections/CounterpartyFormActions.svelte';
	import PerformerBasicsSection from './sections/PerformerBasicsSection.svelte';
	import PerformerPerformanceSection from './sections/PerformerPerformanceSection.svelte';
	import PerformerBookingSection from './sections/PerformerBookingSection.svelte';
	import PerformerPaymentSection from './sections/PerformerPaymentSection.svelte';
	import { savePerformerForm } from '$lib/forms/counterparties/performer';

	interface Props {
		performer?: PerformerContractor | null;
		onSuccess?: (performerId: string) => void;
		onCancel?: () => void;
	}

	let { performer = null, onSuccess, onCancel }: Props = $props();
	const formState = new PerformerFormState();

	onMount(() => {
		formState.init(performer);
	});

	async function handleSubmit() {
		if (!authState.user) {
			formState.error = 'You must be logged in to create a performer';
			return;
		}

		formState.isSubmitting = true;
		formState.error = null;

		try {
			const performerId = await savePerformerForm({
				values: formState,
				ownerUid: authState.user.uid,
				performer
			});

			onSuccess?.(performerId);
		} catch (error) {
			logger.error('Error saving performer:', error);
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

	<PerformerBasicsSection {formState} />
	<PerformerPerformanceSection {formState} />
	<PerformerBookingSection {formState} />
	<PerformerPaymentSection {formState} />
	<CounterpartyNotesSection
		bind:value={formState.notes}
		placeholder="Additional notes about this performer..."
	/>
	<CounterpartyFormActions
		isSubmitting={formState.isSubmitting}
		isEditing={Boolean(performer)}
		entityLabel="Performer"
		{onCancel}
	/>
</form>
