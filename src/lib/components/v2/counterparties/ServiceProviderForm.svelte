<script lang="ts">
	import { onMount } from 'svelte';
	import type { ServiceProviderContractor } from '$lib/types/v2';
	import { authState } from '$lib/state/auth.svelte';
	import { ServiceProviderFormState } from '$lib/state/v2/serviceProviderFormState.svelte';
	import FormMessage from '$lib/components/FormMessage.svelte';
	import { CounterpartyDocumentManager } from '$lib/utils/counterpartyDocuments';
	import { logger } from '$lib/utils/logger';
	import { toast } from 'svelte-sonner';
	import {
		saveServiceProviderForm,
		type ServiceProviderDocumentNumber
	} from '$lib/forms/counterparties/serviceProvider';
	import ServiceProviderBasicsSection from './sections/ServiceProviderBasicsSection.svelte';
	import ServiceProviderDetailsSection from './sections/ServiceProviderDetailsSection.svelte';
	import ServiceProviderBusinessSection from './sections/ServiceProviderBusinessSection.svelte';
	import ServiceProviderBankingSection from './sections/ServiceProviderBankingSection.svelte';
	import ServiceProviderDocumentsSection from './sections/ServiceProviderDocumentsSection.svelte';
	import CounterpartyNotesSection from './sections/CounterpartyNotesSection.svelte';
	import CounterpartyFormActions from './sections/CounterpartyFormActions.svelte';

	interface Props {
		serviceProvider?: ServiceProviderContractor | null;
		onSuccess?: (serviceProviderId: string) => void;
		onCancel?: () => void;
	}

	let { serviceProvider = null, onSuccess, onCancel }: Props = $props();

	const formState = new ServiceProviderFormState();
	let counterpartyId = $state<string | null>(null);

	onMount(() => {
		formState.init(serviceProvider);
		if (serviceProvider?.id) {
			counterpartyId = serviceProvider.id;
		} else if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
			counterpartyId = window.crypto.randomUUID();
		}
	});

	let documentManager = $derived(
		counterpartyId ? new CounterpartyDocumentManager(counterpartyId) : null
	);

	async function handleFileUpload(file: File, imageNumber: ServiceProviderDocumentNumber) {
		if (!authState.user || !documentManager) {
			toast.error('Unable to upload: missing authentication or counterparty ID');
			return;
		}

		formState.setUploading(imageNumber, true);

		try {
			const metadata = await documentManager.uploadDocument(file, imageNumber, authState.user.uid);
			formState.setDocument(imageNumber, metadata);
			toast.success(`Document ${imageNumber} uploaded successfully`);
		} catch (error) {
			logger.error('Error uploading document:', error);
			toast.error('Failed to upload document: ' + (error as Error).message);
		} finally {
			formState.setUploading(imageNumber, false);
		}
	}

	async function handleFileDelete(imageNumber: ServiceProviderDocumentNumber) {
		if (!documentManager) {
			toast.error('Unable to delete: missing counterparty ID');
			return;
		}

		try {
			await documentManager.deleteDocument(imageNumber);
			formState.setDocument(imageNumber, undefined);
			toast.success(`Document ${imageNumber} deleted`);
		} catch (error) {
			logger.error('Error deleting document:', error);
			toast.error('Failed to delete document');
		}
	}

	async function handleSubmit() {
		if (!authState.user) {
			formState.error = 'You must be logged in to create a service provider';
			return;
		}

		formState.isSubmitting = true;
		formState.error = null;

		try {
			const serviceProviderId = await saveServiceProviderForm({
				values: formState,
				ownerUid: authState.user.uid,
				serviceProvider
			});

			onSuccess?.(serviceProviderId);
		} catch (error) {
			logger.error('Error saving service provider:', error);
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

	<ServiceProviderBasicsSection {formState} />
	<ServiceProviderDetailsSection {formState} />
	<ServiceProviderBusinessSection {formState} />
	<ServiceProviderBankingSection {formState} />
	<ServiceProviderDocumentsSection
		{formState}
		{counterpartyId}
		onFileUpload={handleFileUpload}
		onFileDelete={handleFileDelete}
	/>

	<CounterpartyNotesSection
		bind:value={formState.notes}
		placeholder="Additional notes about this service provider..."
	/>
	<CounterpartyFormActions
		isSubmitting={formState.isSubmitting}
		isEditing={Boolean(serviceProvider)}
		entityLabel="Service Provider"
		{onCancel}
	/>
</form>
