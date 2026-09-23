<script lang="ts">
	import type { EventPlanningContract } from '$lib/types/v2';
	import { saveEventPlanningForm } from '$lib/forms/contracts/eventPlanning';
	import { createInlineClient } from '$lib/forms/counterparties/client';
	import { createInlineEvent } from '$lib/forms/events/event';
	import { Timestamp } from 'firebase/firestore';
	import { authState } from '$lib/state/auth.svelte';
	import { eventState, counterpartyState } from '$lib/state/v2';
	import { EventPlanningContractFormState } from '$lib/state/v2/eventPlanningContractFormState.svelte';
	import { onMount } from 'svelte';
	import { logger } from '$lib/utils/logger';
	import { toast } from 'svelte-sonner';
	import FormMessage from '$lib/components/FormMessage.svelte';
	import CounterpartyNotesSection from '../counterparties/sections/CounterpartyNotesSection.svelte';
	import CounterpartyFormActions from '../counterparties/sections/CounterpartyFormActions.svelte';
	import EventPlanningContractBasicsSection from './sections/EventPlanningContractBasicsSection.svelte';
	import EventPlanningCompanyInfoSection from './sections/EventPlanningCompanyInfoSection.svelte';
	import EventPlanningRepresentativeInfoSection from './sections/EventPlanningRepresentativeInfoSection.svelte';
	import EventPlanningBasicInfoSection from './sections/EventPlanningBasicInfoSection.svelte';
	import EventPlanningEventDetailsSection from './sections/EventPlanningEventDetailsSection.svelte';
	import EventPlanningContractValueSection from './sections/EventPlanningContractValueSection.svelte';
	import EventPlanningPaymentTermsSection from './sections/EventPlanningPaymentTermsSection.svelte';
	import EventPlanningInsuranceSection from './sections/EventPlanningInsuranceSection.svelte';
	import EventPlanningPlanningBookingSection from './sections/EventPlanningPlanningBookingSection.svelte';
	import EventPlanningSetupExecutionSection from './sections/EventPlanningSetupExecutionSection.svelte';
	import EventPlanningBreakdownSection from './sections/EventPlanningBreakdownSection.svelte';
	import EventPlanningLegalTimePeriodsSection from './sections/EventPlanningLegalTimePeriodsSection.svelte';
	import EventPlanningArbitrationSection from './sections/EventPlanningArbitrationSection.svelte';

	interface Props {
		contract?: EventPlanningContract | null;
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

	// Get available events and clients for selection
	const events = $derived(eventState.events);
	const clients = $derived(counterpartyState.counterparties.filter((c) => c.type === 'client'));

	// Create form state instance
	const formState = new EventPlanningContractFormState();

	// Initialize form state from prop on mount
	onMount(() => {
		formState.init(contract, initialEventId);
	});

	// Get selected event and counterparty names for submission
	let eventName = $derived(events.find((e) => e.id === formState.eventId)?.name || '');
	let counterpartyName = $derived(
		clients.find((c) => c.id === formState.counterpartyId)?.name || ''
	);

	// Handle event change - auto-fill event details for new contracts only
	function handleEventChange() {
		if (!contract && formState.eventId && events.length > 0) {
			const selectedEvent = events.find((e) => e.id === formState.eventId);
			if (selectedEvent) {
				formState.fillFromEvent(selectedEvent);
			}
		}
	}

	// Handle counterparty change - auto-fill client details for new contracts only
	function handleClientChange() {
		if (!contract && formState.counterpartyId && clients.length > 0) {
			const selectedClient = clients.find((c) => c.id === formState.counterpartyId);
			if (selectedClient && selectedClient.type === 'client') {
				formState.fillFromClient(selectedClient);
			}
		}
	}

	// Inline event creation
	async function handleCreateEvent() {
		if (!authState.user) {
			toast.error('You must be logged in to create an event');
			return;
		}

		if (!formState.newEventName) {
			toast.error('Please fill in event name');
			return;
		}

		if (!formState.newEventDate) {
			toast.error('Please fill in event date');
			return;
		}

		if (!formState.newEventLocationAddress) {
			toast.error('Please fill in location address');
			return;
		}

		formState.isCreatingEvent = true;
		try {
			const { id: eventId, data: eventData } = await createInlineEvent(
				{
					name: formState.newEventName,
					eventDate: formState.newEventDate,
					eventType: formState.newEventType,
					description: formState.newEventDescription,
					locationAddress: formState.newEventLocationAddress,
					locationName: formState.newEventLocationName,
					expectedAttendance: formState.newEventExpectedAttendance
				},
				authState.user.uid
			);

			toast.success('Event created successfully!');

			// Select the newly created event and auto-fill fields
			formState.eventId = eventId;
			formState.fillFromEvent({
				...eventData,
				id: eventId,
				createdAt: Timestamp.now(),
				updatedAt: Timestamp.now(),
				contractIds: [],
				totalReceivable: 0,
				totalPayable: 0,
				netRevenue: 0
			});

			// Reset inline form and hide
			formState.newEventName = '';
			formState.newEventDate = '';
			formState.newEventType = '';
			formState.newEventDescription = '';
			formState.newEventLocationAddress = '';
			formState.newEventLocationName = '';
			formState.newEventExpectedAttendance = null;
			formState.showCreateEvent = false;
		} catch (e) {
			logger.error('Error creating event:', e);
			toast.error('Failed to create event');
		} finally {
			formState.isCreatingEvent = false;
		}
	}

	// Inline counterparty creation
	async function handleCreateCounterparty() {
		if (!authState.user) {
			toast.error('You must be logged in to create a counterparty');
			return;
		}

		if (!formState.newCounterpartyName) {
			toast.error('Please fill in counterparty name');
			return;
		}

		formState.isCreatingCounterparty = true;
		try {
			const counterpartyId = await createInlineClient(
				{
					name: formState.newCounterpartyName,
					email: formState.newCounterpartyEmail,
					phone: formState.newCounterpartyPhone,
					address: formState.newCounterpartyAddress,
					companyName: formState.newCounterpartyCompanyName,
					taxId: formState.newCounterpartyTaxId,
					bankName: formState.newCounterpartyBankName,
					bankAccountNumber: formState.newCounterpartyBankAccountNumber,
					representativeName: formState.newCounterpartyRepresentativeName,
					representativePosition: formState.newCounterpartyRepresentativePosition
				},
				authState.user.uid
			);

			toast.success('Client created successfully!');

			// Select the newly created counterparty and auto-fill directly from form fields
			formState.counterpartyId = counterpartyId;
			formState.clientCompany =
				formState.newCounterpartyCompanyName || formState.newCounterpartyName;
			formState.clientAddress = formState.newCounterpartyAddress;
			formState.clientTaxCode = formState.newCounterpartyTaxId;
			formState.clientRepresentativeName = formState.newCounterpartyRepresentativeName;
			formState.clientRepresentativePosition = formState.newCounterpartyRepresentativePosition;

			// Reset inline form and hide
			formState.newCounterpartyName = '';
			formState.newCounterpartyEmail = '';
			formState.newCounterpartyPhone = '';
			formState.newCounterpartyAddress = '';
			formState.newCounterpartyCompanyName = '';
			formState.newCounterpartyTaxId = '';
			formState.newCounterpartyRepresentativeName = '';
			formState.newCounterpartyRepresentativePosition = '';
			formState.newCounterpartyBankName = '';
			formState.newCounterpartyBankAccountNumber = '';
			formState.showCreateCounterparty = false;
		} catch (e) {
			logger.error('Error creating counterparty:', e);
			toast.error('Failed to create client');
		} finally {
			formState.isCreatingCounterparty = false;
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
			const contractId = await saveEventPlanningForm({
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
	<EventPlanningContractBasicsSection
		{formState}
		{events}
		{clients}
		onClientChange={handleClientChange}
		onEventChange={handleEventChange}
		onCreateCounterparty={handleCreateCounterparty}
		onCreateEvent={handleCreateEvent}
	/>

	<!-- Client Information Sections -->
	<EventPlanningCompanyInfoSection {formState} />
	<EventPlanningRepresentativeInfoSection {formState} />

	<!-- Event Information Sections -->
	<EventPlanningBasicInfoSection {formState} />
	<EventPlanningEventDetailsSection {formState} />

	<!-- Financial Terms Sections -->
	<EventPlanningContractValueSection {formState} />
	<EventPlanningPaymentTermsSection {formState} />
	<EventPlanningInsuranceSection {formState} />

	<!-- Timeline Sections -->
	<EventPlanningPlanningBookingSection {formState} />
	<EventPlanningSetupExecutionSection {formState} />
	<EventPlanningBreakdownSection {formState} />

	<!-- Legal Terms Sections -->
	<EventPlanningLegalTimePeriodsSection {formState} />
	<EventPlanningArbitrationSection {formState} />

	<CounterpartyNotesSection bind:value={formState.notes} placeholder="Internal notes..." />
	<CounterpartyFormActions
		isSubmitting={formState.isSubmitting}
		isEditing={Boolean(contract)}
		entityLabel="Contract"
		{onCancel}
	/>
</form>
