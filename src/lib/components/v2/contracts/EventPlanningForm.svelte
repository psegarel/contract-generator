<script lang="ts">
	import type { EventPlanningContract } from '$lib/types/v2';
	import type { EventInput } from '$lib/types/v2/event';
	import {
		eventPlanningContractInputSchema,
		type EventPlanningContractInput
	} from '$lib/schemas/v2/contracts/eventPlanning';
	import { saveEventPlanningContract, updateEventPlanningContract, saveEvent } from '$lib/utils/v2';
	import { createOneTimePayment, deletePaymentsByContract } from '$lib/utils/v2/payments';
	import { saveCounterparty } from '$lib/utils/v2/counterparties';
	import {
		clientCounterpartySchema,
		type ClientCounterpartyInput
	} from '$lib/schemas/v2/counterparty';
	import { eventInputSchema } from '$lib/schemas/v2';
	import { Timestamp } from 'firebase/firestore';
	import { authState } from '$lib/state/auth.svelte';
	import { eventState, counterpartyState } from '$lib/state/v2';
	import { EventPlanningContractFormState } from '$lib/state/v2/eventPlanningContractFormState.svelte';
	import { Button } from '$lib/components/ui/button';
	import { onMount } from 'svelte';
	import { logger } from '$lib/utils/logger';
	import { toast } from 'svelte-sonner';
	import TextareaField from '$lib/components/TextareaField.svelte';
	import FormSection from '$lib/components/FormSection.svelte';
	import FormMessage from '$lib/components/FormMessage.svelte';
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
			const eventData: EventInput = {
				ownerUid: authState.user.uid,
				name: formState.newEventName,
				eventDate: formState.newEventDate,
				eventType: formState.newEventType || null,
				description: formState.newEventDescription || null,
				locationAddress: formState.newEventLocationAddress,
				locationName: formState.newEventLocationName || null,
				venueCounterpartyId: null,
				startTime: null,
				endTime: null,
				setupDateTime: null,
				teardownDateTime: null,
				expectedAttendance: formState.newEventExpectedAttendance,
				status: 'planning',
				internalNotes: null
			};

			const validationResult = eventInputSchema.safeParse(eventData);
			if (!validationResult.success) {
				toast.error('Validation error: ' + validationResult.error.issues[0].message);
				return;
			}

			const eventId = await saveEvent(eventData);

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
			const clientData: ClientCounterpartyInput = {
				type: 'client',
				clientType: 'company',
				ownerUid: authState.user.uid,
				name: formState.newCounterpartyName,
				email: formState.newCounterpartyEmail || null,
				phone: formState.newCounterpartyPhone || null,
				address: formState.newCounterpartyAddress || null,
				companyName: formState.newCounterpartyCompanyName || null,
				taxId: formState.newCounterpartyTaxId || null,
				bankName: formState.newCounterpartyBankName || null,
				bankAccountNumber: formState.newCounterpartyBankAccountNumber || null,
				representativeName: formState.newCounterpartyRepresentativeName || null,
				representativePosition: formState.newCounterpartyRepresentativePosition || null,
				idDocument: null,
				notes: null,
				createdAt: Timestamp.now(),
				updatedAt: Timestamp.now()
			};

			const validationResult = clientCounterpartySchema.safeParse(clientData);
			if (!validationResult.success) {
				toast.error('Validation error: ' + validationResult.error.issues[0].message);
				return;
			}

			const counterpartyId = await saveCounterparty(clientData);

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

		if (!formState.eventId) {
			formState.error = 'Please select an event';
			return;
		}

		if (!formState.counterpartyId) {
			formState.error = 'Please select a client';
			return;
		}

		formState.isSubmitting = true;
		formState.error = null;

		try {
			const contractData: EventPlanningContractInput = {
				type: 'event-planning',
				ownerUid: authState.user.uid,
				contractNumber: formState.contractNumber,
				eventId: formState.eventId,
				counterpartyId: formState.counterpartyId,
				counterpartyName,
				eventName,
				paymentDirection: 'receivable',
				paymentStatus: formState.paymentStatus,
				contractValue: formState.contractValueVND,
				currency: 'VND',
				notes: formState.notes || null,
				contractDate: formState.contractDate,
				contractLocation: formState.contractLocation,
				clientCompany: formState.clientCompany,
				clientAddress: formState.clientAddress,
				clientTaxCode: formState.clientTaxCode,
				clientRepresentativeName: formState.clientRepresentativeName,
				clientRepresentativePosition: formState.clientRepresentativePosition,
				eventTheme: formState.eventTheme || null,
				eventType: formState.eventType || null,
				eventDescription: formState.eventDescription || null,
				eventVenue: formState.eventVenue,
				eventDate: formState.eventDate,
				eventDuration: formState.eventDuration || null,
				expectedAttendance: formState.expectedAttendance || null,
				contractValueVND: formState.contractValueVND,
				vatRate: formState.vatRate,
				depositPercentage: formState.depositPercentage,
				finalPaymentPercentage: formState.finalPaymentPercentage,
				professionalIndemnityAmount: formState.professionalIndemnityAmount,
				publicLiabilityAmount: formState.publicLiabilityAmount,
				planningMeetingDays: formState.planningMeetingDays,
				performerBookingDeadline: formState.performerBookingDeadline,
				technicalSetupDate: formState.technicalSetupDate,
				eventExecutionDate: formState.eventExecutionDate,
				setupCommencementTime: formState.setupCommencementTime,
				eventExecutionDuration: formState.eventExecutionDuration,
				breakdownCompletionDateTime: formState.breakdownCompletionDateTime,
				paymentGracePeriodDays: formState.paymentGracePeriodDays,
				terminationNoticeDays: formState.terminationNoticeDays,
				negotiationPeriodDays: formState.negotiationPeriodDays,
				arbitrationLocation: formState.arbitrationLocation,
				arbitrationLanguage: formState.arbitrationLanguage,
				paymentDueDate: formState.paymentDueDate || formState.eventDate
			};

			// Validate with schema
			const validationResult = eventPlanningContractInputSchema.safeParse(contractData);
			if (!validationResult.success) {
				formState.error = 'Validation error: ' + validationResult.error.issues[0].message;
				return;
			}

			let contractId: string;
			if (contract) {
				await updateEventPlanningContract(contract.id, contractData);
				contractId = contract.id;
			} else {
				contractId = await saveEventPlanningContract(contractData);
			}

			// Create/recreate payment record
			try {
				if (contract) {
					await deletePaymentsByContract(contractId);
				}
				await createOneTimePayment(
					{
						id: contractId,
						type: contractData.type,
						contractNumber: contractData.contractNumber,
						counterpartyName: contractData.counterpartyName,
						paymentDirection: contractData.paymentDirection,
						paymentStatus: contractData.paymentStatus,
						contractValue: contractData.contractValue,
						currency: contractData.currency,
						ownerUid: contractData.ownerUid
					},
					contractData.paymentDueDate
				);
			} catch (paymentError) {
				logger.error('Error creating payment record:', paymentError);
			}

			if (onSuccess) {
				onSuccess(contractId);
			}
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

	<!-- Notes -->
	<FormSection title="Internal Notes">
		<TextareaField
			id="notes"
			label="Notes"
			bind:value={formState.notes}
			rows={4}
			placeholder="Internal notes..."
		/>
	</FormSection>

	<!-- Form Actions -->
	<div class="flex gap-3 justify-end">
		{#if onCancel}
			<Button variant="outline" type="button" onclick={onCancel} disabled={formState.isSubmitting}>
				Cancel
			</Button>
		{/if}
		<Button type="submit" disabled={formState.isSubmitting} variant="dark">
			{formState.isSubmitting ? 'Saving...' : contract ? 'Update Contract' : 'Create Contract'}
		</Button>
	</div>
</form>
