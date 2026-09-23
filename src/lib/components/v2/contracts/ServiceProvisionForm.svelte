<script lang="ts">
	import type { ServiceProvisionContract } from '$lib/types/v2';
	import { saveServiceProvisionForm } from '$lib/forms/contracts/serviceProvision';
	import { createInlineServiceProvider } from '$lib/forms/counterparties/serviceProvider';
	import { authState } from '$lib/state/auth.svelte';
	import { eventState, counterpartyState } from '$lib/state/v2';
	import { ServiceProvisionContractFormState } from '$lib/state/v2/serviceProvisionContractFormState.svelte';
	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';
	import FormMessage from '$lib/components/FormMessage.svelte';
	import { logger } from '$lib/utils/logger';
	import ContractBasicsSection from './sections/ContractBasicsSection.svelte';
	import CreateProviderInline from './sections/CreateProviderInline.svelte';
	import ServiceDetailsSection from './sections/ServiceDetailsSection.svelte';
	import FinancialSection from './sections/FinancialSection.svelte';
	import BankingSection from './sections/BankingSection.svelte';
	import ClientInfoSection from './sections/ClientInfoSection.svelte';
	import CounterpartyNotesSection from '../counterparties/sections/CounterpartyNotesSection.svelte';
	import CounterpartyFormActions from '../counterparties/sections/CounterpartyFormActions.svelte';

	interface Props {
		contract?: ServiceProvisionContract | null;
		initialEventId?: string;
		onSuccess?: (contractId: string) => void;
		onCancel?: () => void;
	}

	let { contract = null, initialEventId = '', onSuccess, onCancel }: Props = $props();

	// Initialize event and counterparty state
	onMount(() => {
		eventState.init();
		counterpartyState.init();

		return () => {
			eventState.destroy();
			counterpartyState.destroy();
		};
	});

	// Get available events and contractors for selection
	// Includes both service-provider and performer contractor types
	const events = $derived(eventState.events);
	const serviceProviders = $derived(counterpartyState.contractors);

	// Create form state instance
	const formState = new ServiceProvisionContractFormState();

	// Initialize form state from prop on mount
	onMount(() => {
		formState.init(contract, initialEventId);
	});

	// Get selected event and counterparty names for submission
	// '__standalone__' sentinel = recurring contract with no specific event
	// Fall back to contract.eventName for synthetic IDs (e.g. djr-... from DJ residency generation)
	// that don't correspond to a real event document
	let eventName = $derived(
		formState.eventId === '__standalone__'
			? 'Recurring'
			: events.find((e) => e.id === formState.eventId)?.name || contract?.eventName || ''
	);
	let counterpartyName = $derived(
		serviceProviders.find((c) => c.id === formState.counterpartyId)?.name || ''
	);

	// Handle counterparty change - auto-fill client details for new contracts only
	function handleCounterpartyChange() {
		// Only auto-fill for new contracts
		if (!contract && formState.counterpartyId && serviceProviders.length > 0) {
			const selectedProvider = serviceProviders.find((c) => c.id === formState.counterpartyId);
			if (selectedProvider) {
				formState.fillFromServiceProvider(selectedProvider);
			}
		}
	}

	async function handleCreateProvider() {
		if (!authState.user) {
			toast.error('You must be logged in to create a service provider');
			return;
		}

		if (!formState.newProviderName || !formState.newProviderServiceType) {
			toast.error('Please fill in provider name and service type');
			return;
		}

		formState.isCreatingProvider = true;
		try {
			const providerId = await createInlineServiceProvider(
				{
					name: formState.newProviderName,
					serviceType: formState.newProviderServiceType,
					email: formState.newProviderEmail,
					phone: formState.newProviderPhone
				},
				authState.user.uid
			);

			toast.success('Service provider created successfully!');

			// Select the newly created provider
			formState.counterpartyId = providerId;

			// Reset form and hide
			formState.resetNewProviderForm();
		} catch (err) {
			logger.error('Error creating provider:', err);
			toast.error('Failed to create service provider');
		} finally {
			formState.isCreatingProvider = false;
		}
	}

	async function handleSubmit() {
		if (!authState.user) {
			formState.error = 'You must be logged in to create a contract';
			return;
		}

		formState.isSubmitting = true;
		formState.error = null;

		try {
			const contractId = await saveServiceProvisionForm({
				values: formState,
				ownerUid: authState.user.uid,
				eventName,
				counterpartyName,
				contract
			});

			onSuccess?.(contractId);
		} catch (e) {
			logger.error('Error saving contract:', e);
			formState.error = (e as Error).message;
		} finally {
			formState.isSubmitting = false;
		}
	}
</script>

<form
	onsubmit={(e) => {
		e.preventDefault();
		handleSubmit();
	}}
	novalidate
	class="space-y-6"
>
	<!-- Error message -->
	{#if formState.error}
		<FormMessage message={formState.error} />
	{/if}

	<!-- Contract Basics -->
	<ContractBasicsSection
		{formState}
		{events}
		{serviceProviders}
		onCreateProviderClick={() => (formState.showCreateProvider = !formState.showCreateProvider)}
		onCounterpartyChange={handleCounterpartyChange}
	/>

	<!-- Inline Service Provider Creation Form -->
	{#if formState.showCreateProvider}
		<CreateProviderInline
			{formState}
			onCancel={() => {
				formState.showCreateProvider = false;
				formState.resetNewProviderForm();
			}}
			onCreate={handleCreateProvider}
		/>
	{/if}

	<!-- Service Details Section -->
	<ServiceDetailsSection {formState} />

	<!-- Financial Section -->
	<FinancialSection {formState} />

	<!-- Banking Section -->
	<BankingSection {formState} />

	<!-- Client Info Section -->
	<ClientInfoSection {formState} />

	<CounterpartyNotesSection bind:value={formState.notes} placeholder="Internal notes..." />
	<CounterpartyFormActions
		isSubmitting={formState.isSubmitting}
		isEditing={Boolean(contract)}
		entityLabel="Contract"
		{onCancel}
	/>
</form>
