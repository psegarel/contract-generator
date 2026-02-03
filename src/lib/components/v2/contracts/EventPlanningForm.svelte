<script lang="ts">
	import type { EventPlanningContract } from '$lib/types/v2';
	import {
		eventPlanningContractInputSchema,
		type EventPlanningContractInput
	} from '$lib/schemas/v2/contracts/eventPlanning';
	import { saveEventPlanningContract, updateEventPlanningContract } from '$lib/utils/v2';
	import { createOneTimePayment, deletePaymentsByContract } from '$lib/utils/v2/payments';
	import { authState } from '$lib/state/auth.svelte';
	import { eventState, counterpartyState } from '$lib/state/v2';
	import { EventPlanningContractFormState } from '$lib/state/v2/eventPlanningContractFormState.svelte';
import { Button } from '$lib/components/ui/button';
import { onMount } from 'svelte';
import { logger } from '$lib/utils/logger';
	import TextareaField from '$lib/components/TextareaField.svelte';
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

	// Handle counterparty change - auto-fill client details for new contracts only
	function handleClientChange() {
		// Only auto-fill for new contracts
		if (!contract && formState.counterpartyId && clients.length > 0) {
			const selectedClient = clients.find((c) => c.id === formState.counterpartyId);
			if (selectedClient && selectedClient.type === 'client') {
				formState.fillFromClient(selectedClient);
			}
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
					} as any,
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

<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} novalidate class="space-y-6">
	<!-- Error message -->
	{#if formState.error}
		<div class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
			{formState.error}
		</div>
	{/if}

	<!-- Contract Basics -->
	<EventPlanningContractBasicsSection
		{formState}
		{events}
		{clients}
		onClientChange={handleClientChange}
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
	<div class="bg-white p-6 rounded-lg border border-gray-200">
		<h3 class="text-lg font-semibold text-gray-900 mb-4">Internal Notes</h3>
		<TextareaField
			id="notes"
			label=""
			bind:value={formState.notes}
			rows={4}
			placeholder="Internal notes..."
		/>
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
			{formState.isSubmitting ? 'Saving...' : contract ? 'Update Contract' : 'Create Contract'}
		</Button>
	</div>
</form>
