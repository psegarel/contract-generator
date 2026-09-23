<script lang="ts">
	import { onMount } from 'svelte';
	import type { ClientCounterparty } from '$lib/types/v2';
	import { authState } from '$lib/state/auth.svelte';
	import { ClientFormState } from '$lib/state/v2/clientFormState.svelte';
	import { logger } from '$lib/utils/logger';
	import FormMessage from '$lib/components/FormMessage.svelte';
	import CounterpartyNotesSection from './sections/CounterpartyNotesSection.svelte';
	import CounterpartyFormActions from './sections/CounterpartyFormActions.svelte';
	import ClientBasicsSection from './sections/ClientBasicsSection.svelte';
	import ClientCompanySection from './sections/ClientCompanySection.svelte';
	import ClientIndividualSection from './sections/ClientIndividualSection.svelte';
	import ClientBankingSection from './sections/ClientBankingSection.svelte';
	import { saveClientForm } from '$lib/forms/counterparties/client';

	interface Props {
		client?: ClientCounterparty | null;
		onSuccess?: (clientId: string) => void;
		onCancel?: () => void;
	}

	let { client = null, onSuccess, onCancel }: Props = $props();
	const formState = new ClientFormState();

	onMount(() => {
		formState.init(client);
	});

	async function handleSubmit() {
		if (!authState.user) {
			formState.error = 'You must be logged in to create a client';
			return;
		}

		formState.isSubmitting = true;
		formState.error = null;

		try {
			const clientId = await saveClientForm({
				values: formState,
				ownerUid: authState.user.uid,
				client
			});

			onSuccess?.(clientId);
		} catch (error) {
			logger.error('Error saving client:', error);
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

	<ClientBasicsSection {formState} />
	{#if formState.clientType === 'company'}
		<ClientCompanySection {formState} />
	{:else}
		<ClientIndividualSection {formState} />
	{/if}
	<ClientBankingSection {formState} />
	<CounterpartyNotesSection
		bind:value={formState.notes}
		placeholder="Additional notes about this client..."
	/>
	<CounterpartyFormActions
		isSubmitting={formState.isSubmitting}
		isEditing={Boolean(client)}
		entityLabel="Client"
		{onCancel}
	/>
</form>
