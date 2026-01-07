<script lang="ts">
	import type { EventPlanningContract } from '$lib/types/v2';
	import {
		eventPlanningContractInputSchema,
		type EventPlanningContractInput
	} from '$lib/schemas/v2/contracts/eventPlanning';
	import { saveEventPlanningContract, updateEventPlanningContract } from '$lib/utils/v2';
	import { authState } from '$lib/state/auth.svelte';
	import { eventState, counterpartyState } from '$lib/state/v2';
	import { Button } from '$lib/components/ui/button';
	import EventPlanningClientSection from './sections/EventPlanningClientSection.svelte';
	import EventPlanningEventInfoSection from './sections/EventPlanningEventInfoSection.svelte';
	import EventPlanningFinancialSection from './sections/EventPlanningFinancialSection.svelte';
	import EventPlanningTimelineSection from './sections/EventPlanningTimelineSection.svelte';
	import EventPlanningLegalSection from './sections/EventPlanningLegalSection.svelte';

	interface Props {
		contract?: EventPlanningContract | null;
		onSuccess?: (contractId: string) => void;
		onCancel?: () => void;
	}

	let { contract = null, onSuccess, onCancel }: Props = $props();

	// Initialize state
	$effect(() => {
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

	// Form state - initialize empty, sync with contract prop via $effect
	let contractNumber = $state('');
	let contractDate = $state('');
	let contractLocation = $state('');
	let eventId = $state<string>('');
	let counterpartyId = $state<string>('');
	let clientCompany = $state('');
	let clientAddress = $state('');
	let clientTaxCode = $state('');
	let clientRepresentativeName = $state('');
	let clientRepresentativePosition = $state('');
	let eventTheme = $state('');
	let eventType = $state('');
	let eventDescription = $state('');
	let eventVenue = $state('');
	let eventDate = $state('');
	let eventDuration = $state('');
	let expectedAttendance = $state('');
	let contractValueVND = $state(0);
	let vatRate = $state(10);
	let depositPercentage = $state(50);
	let finalPaymentPercentage = $state(50);
	let professionalIndemnityAmount = $state(0);
	let publicLiabilityAmount = $state(0);
	let planningMeetingDays = $state(7);
	let performerBookingDeadline = $state('');
	let technicalSetupDate = $state('');
	let eventExecutionDate = $state('');
	let setupCommencementTime = $state('');
	let eventExecutionDuration = $state('');
	let breakdownCompletionDateTime = $state('');
	let paymentGracePeriodDays = $state(30);
	let terminationNoticeDays = $state(7);
	let negotiationPeriodDays = $state(14);
	let arbitrationLocation = $state('Ho Chi Minh City');
	let arbitrationLanguage = $state('Vietnamese');
	let paymentStatus = $state<'unpaid' | 'paid'>('unpaid');
	let notes = $state('');

	// Sync form state with contract prop (only on initial load or contract change)
	$effect(() => {
		if (contract) {
			// Handle both v1 (nested contractData) and v2 (flat) structures
			const contractData = (contract as any).contractData;
			const isV1Structure = !!contractData;
			
			// Helper to get value from either v1 (contractData) or v2 (contract) structure
			const getValue = <T>(v1Key: string, v2Key?: string): T => {
				if (isV1Structure && contractData) {
					return (contractData[v1Key] ?? (contract as any)[v2Key || v1Key]) as T;
				}
				return ((contract as any)[v2Key || v1Key] ?? '') as T;
			};
			
			const getNumber = (v1Key: string, v2Key?: string, defaultValue: number = 0): number => {
				if (isV1Structure && contractData) {
					return contractData[v1Key] ?? (contract as any)[v2Key || v1Key] ?? defaultValue;
				}
				return (contract as any)[v2Key || v1Key] ?? defaultValue;
			};
			
			// Explicitly access each property to ensure reactivity tracking
			contractNumber = contract.contractNumber ?? '';
			contractDate = getValue<string>('contractDate');
			contractLocation = getValue<string>('contractLocation');
			eventId = contract.eventId ?? '';
			counterpartyId = contract.counterpartyId ?? '';
			clientCompany = getValue<string>('clientCompany');
			clientAddress = getValue<string>('clientAddress');
			clientTaxCode = getValue<string>('clientTaxCode');
			clientRepresentativeName = getValue<string>('clientRepresentativeName');
			clientRepresentativePosition = getValue<string>('clientRepresentativePosition');
			eventTheme = getValue<string | null>('eventTheme') ?? '';
			eventType = getValue<string | null>('eventType') ?? '';
			eventDescription = getValue<string | null>('eventDescription') ?? '';
			eventVenue = getValue<string>('eventVenue');
			eventDate = getValue<string>('eventDate');
			eventDuration = getValue<string | null>('eventDuration') ?? '';
			expectedAttendance = getValue<string | null>('expectedAttendance') ?? '';
			contractValueVND = getNumber('contractValueVND', undefined, 0);
			vatRate = getNumber('vatRate', undefined, 10);
			depositPercentage = getNumber('depositPercentage', undefined, 50);
			finalPaymentPercentage = getNumber('finalPaymentPercentage', undefined, 50);
			professionalIndemnityAmount = getNumber('professionalIndemnityAmount', undefined, 0);
			publicLiabilityAmount = getNumber('publicLiabilityAmount', undefined, 0);
			planningMeetingDays = getNumber('planningMeetingDays', undefined, 7);
			performerBookingDeadline = getValue<string>('performerBookingDeadline');
			technicalSetupDate = getValue<string>('technicalSetupDate');
			eventExecutionDate = getValue<string>('eventExecutionDate');
			setupCommencementTime = getValue<string>('setupCommencementTime');
			eventExecutionDuration = getValue<string>('eventExecutionDuration');
			breakdownCompletionDateTime = getValue<string>('breakdownCompletionDateTime');
			paymentGracePeriodDays = getNumber('paymentGracePeriodDays', undefined, 30);
			terminationNoticeDays = getNumber('terminationNoticeDays', undefined, 7);
			negotiationPeriodDays = getNumber('negotiationPeriodDays', undefined, 14);
			arbitrationLocation = getValue<string>('arbitrationLocation', undefined) || 'Ho Chi Minh City';
			arbitrationLanguage = getValue<string>('arbitrationLanguage', undefined) || 'Vietnamese';
			paymentStatus = contract.paymentStatus ?? 'unpaid';
			notes = contract.notes ?? '';
		}
	});

	// Auto-fill client details when client is selected (only for new contracts, not when editing)
	$effect(() => {
		// Don't auto-fill if we're editing an existing contract - preserve contract data
		if (contract) return;

		if (counterpartyId && clients.length > 0) {
			const selectedClient = clients.find((c) => c.id === counterpartyId);
			if (selectedClient && selectedClient.type === 'client') {
				clientCompany = selectedClient.companyName || selectedClient.name;
				clientAddress = selectedClient.address || '';
				clientTaxCode = selectedClient.taxId || '';
				if (selectedClient.representativeName && selectedClient.representativePosition) {
					clientRepresentativeName = selectedClient.representativeName;
					clientRepresentativePosition = selectedClient.representativePosition;
				}
			}
		}
	});

	// Auto-generate contract number when creating new
	$effect(() => {
		if (!contract && !contractNumber) {
			const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
			const timestamp = Date.now().toString().slice(-4);
			contractNumber = `EVT-${dateStr}-${timestamp}`;
		}
	});

	// Get selected event and counterparty names
	let eventName = $derived(events.find((e) => e.id === eventId)?.name || '');
	let counterpartyName = $derived(clients.find((c) => c.id === counterpartyId)?.name || '');

	let isSubmitting = $state(false);
	let error = $state<string | null>(null);

	async function handleSubmit() {
		if (!authState.user) {
			error = 'You must be logged in to create a contract';
			return;
		}

		if (!eventId) {
			error = 'Please select an event';
			return;
		}

		if (!counterpartyId) {
			error = 'Please select a client';
			return;
		}

		isSubmitting = true;
		error = null;

		try {
			const contractData: EventPlanningContractInput = {
				type: 'event-planning',
				ownerUid: authState.user.uid,
				contractNumber,
				eventId,
				counterpartyId,
				counterpartyName,
				eventName,
				paymentDirection: 'receivable',
				paymentStatus,
				contractValue: contractValueVND,
				currency: 'VND',
				notes: notes || null,
				contractDate,
				contractLocation,
				clientCompany,
				clientAddress,
				clientTaxCode,
				clientRepresentativeName,
				clientRepresentativePosition,
				eventTheme: eventTheme || null,
				eventType: eventType || null,
				eventDescription: eventDescription || null,
				eventVenue,
				eventDate,
				eventDuration: eventDuration || null,
				expectedAttendance: expectedAttendance || null,
				contractValueVND,
				vatRate,
				depositPercentage,
				finalPaymentPercentage,
				professionalIndemnityAmount,
				publicLiabilityAmount,
				planningMeetingDays,
				performerBookingDeadline,
				technicalSetupDate,
				eventExecutionDate,
				setupCommencementTime,
				eventExecutionDuration,
				breakdownCompletionDateTime,
				paymentGracePeriodDays,
				terminationNoticeDays,
				negotiationPeriodDays,
				arbitrationLocation,
				arbitrationLanguage
			};

			// Validate with schema
			const validationResult = eventPlanningContractInputSchema.safeParse(contractData);
			if (!validationResult.success) {
				error = 'Validation error: ' + validationResult.error.issues[0].message;
				return;
			}

			let contractId: string;
			if (contract) {
				await updateEventPlanningContract(contract.id, contractData);
				contractId = contract.id;
			} else {
				contractId = await saveEventPlanningContract(contractData);
			}

			if (onSuccess) {
				onSuccess(contractId);
			}
		} catch (e) {
			console.error('Error saving contract:', e);
			error = (e as Error).message;
		} finally {
			isSubmitting = false;
		}
	}
</script>

<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} novalidate class="space-y-6">
	<!-- Error message -->
	{#if error}
		<div class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
			{error}
		</div>
	{/if}

	<!-- Contract Basics -->
	<div class="bg-white p-6 rounded-lg border border-gray-200">
		<h3 class="text-lg font-semibold text-gray-900 mb-4">Contract Basics</h3>
		<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
			<div>
				<label for="contractNumber" class="block text-sm font-medium text-gray-700 mb-1">
					Contract Number <span class="text-red-500">*</span>
				</label>
				<input
					id="contractNumber"
					type="text"
					bind:value={contractNumber}
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
					placeholder="EVT-20260104-1234"
				/>
			</div>

			<div>
				<label for="contractDate" class="block text-sm font-medium text-gray-700 mb-1">
					Contract Date <span class="text-red-500">*</span>
				</label>
				<input
					id="contractDate"
					type="date"
					bind:value={contractDate}
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				/>
			</div>

			<div class="col-span-full">
				<label for="contractLocation" class="block text-sm font-medium text-gray-700 mb-1">
					Contract Location <span class="text-red-500">*</span>
				</label>
				<input
					id="contractLocation"
					type="text"
					bind:value={contractLocation}
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
					placeholder="Ho Chi Minh City"
				/>
			</div>

			<div>
				<label for="eventId" class="block text-sm font-medium text-gray-700 mb-1">
					Event <span class="text-red-500">*</span>
				</label>
				<select
					id="eventId"
					bind:value={eventId}
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				>
					<option value="">Select an event</option>
					{#each events as event}
						<option value={event.id}>{event.name} - {event.eventDate}</option>
					{/each}
				</select>
			</div>

			<div>
				<label for="counterpartyId" class="block text-sm font-medium text-gray-700 mb-1">
					Client <span class="text-red-500">*</span>
				</label>
				<select
					id="counterpartyId"
					bind:value={counterpartyId}
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				>
					<option value="">Select a client</option>
					{#each clients as client}
						<option value={client.id}>{client.name}</option>
					{/each}
				</select>
			</div>

			<div>
				<label for="paymentStatus" class="block text-sm font-medium text-gray-700 mb-1">
					Payment Status <span class="text-red-500">*</span>
				</label>
				<select
					id="paymentStatus"
					bind:value={paymentStatus}
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				>
					<option value="unpaid">Unpaid</option>
					<option value="paid">Paid</option>
				</select>
			</div>
		</div>
	</div>

	<!-- Client Information Section -->
	<EventPlanningClientSection
		{clientCompany}
		{clientAddress}
		{clientTaxCode}
		{clientRepresentativeName}
		{clientRepresentativePosition}
		onclientCompanyChange={(value) => (clientCompany = value)}
		onclientAddressChange={(value) => (clientAddress = value)}
		onclientTaxCodeChange={(value) => (clientTaxCode = value)}
		onclientRepresentativeNameChange={(value) => (clientRepresentativeName = value)}
		onclientRepresentativePositionChange={(value) => (clientRepresentativePosition = value)}
	/>

	<!-- Event Information Section -->
	<EventPlanningEventInfoSection
		{eventTheme}
		{eventType}
		{eventDescription}
		{eventVenue}
		{eventDate}
		{eventDuration}
		{expectedAttendance}
		oneventThemeChange={(value) => (eventTheme = value)}
		oneventTypeChange={(value) => (eventType = value)}
		oneventDescriptionChange={(value) => (eventDescription = value)}
		oneventVenueChange={(value) => (eventVenue = value)}
		oneventDateChange={(value) => (eventDate = value)}
		oneventDurationChange={(value) => (eventDuration = value)}
		onexpectedAttendanceChange={(value) => (expectedAttendance = value)}
	/>

	<!-- Financial Terms Section -->
	<EventPlanningFinancialSection
		{contractValueVND}
		{vatRate}
		{depositPercentage}
		{finalPaymentPercentage}
		{professionalIndemnityAmount}
		{publicLiabilityAmount}
		oncontractValueVNDChange={(value) => (contractValueVND = value)}
		onvatRateChange={(value) => (vatRate = value)}
		ondepositPercentageChange={(value) => (depositPercentage = value)}
		onfinalPaymentPercentageChange={(value) => (finalPaymentPercentage = value)}
		onprofessionalIndemnityAmountChange={(value) => (professionalIndemnityAmount = value)}
		onpublicLiabilityAmountChange={(value) => (publicLiabilityAmount = value)}
	/>

	<!-- Timeline Section -->
	<EventPlanningTimelineSection
		{planningMeetingDays}
		{performerBookingDeadline}
		{technicalSetupDate}
		{eventExecutionDate}
		{setupCommencementTime}
		{eventExecutionDuration}
		{breakdownCompletionDateTime}
		onplanningMeetingDaysChange={(value) => (planningMeetingDays = value)}
		onperformerBookingDeadlineChange={(value) => (performerBookingDeadline = value)}
		ontechnicalSetupDateChange={(value) => (technicalSetupDate = value)}
		oneventExecutionDateChange={(value) => (eventExecutionDate = value)}
		onsetupCommencementTimeChange={(value) => (setupCommencementTime = value)}
		oneventExecutionDurationChange={(value) => (eventExecutionDuration = value)}
		onbreakdownCompletionDateTimeChange={(value) => (breakdownCompletionDateTime = value)}
	/>

	<!-- Legal Terms Section -->
	<EventPlanningLegalSection
		{paymentGracePeriodDays}
		{terminationNoticeDays}
		{negotiationPeriodDays}
		{arbitrationLocation}
		{arbitrationLanguage}
		onpaymentGracePeriodDaysChange={(value) => (paymentGracePeriodDays = value)}
		onterminationNoticeDaysChange={(value) => (terminationNoticeDays = value)}
		onnegotiationPeriodDaysChange={(value) => (negotiationPeriodDays = value)}
		onarbitrationLocationChange={(value) => (arbitrationLocation = value)}
		onarbitrationLanguageChange={(value) => (arbitrationLanguage = value)}
	/>

	<!-- Notes -->
	<div class="bg-white p-6 rounded-lg border border-gray-200">
		<h3 class="text-lg font-semibold text-gray-900 mb-4">Internal Notes</h3>
		<textarea
			id="notes"
			bind:value={notes}
			rows="4"
			class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
			placeholder="Internal notes..."
		></textarea>
	</div>

	<!-- Form Actions -->
	<div class="flex gap-3 justify-end">
		{#if onCancel}
			<button
				type="button"
				onclick={onCancel}
				disabled={isSubmitting}
				class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
			>
				Cancel
			</button>
		{/if}
		<Button type="submit" disabled={isSubmitting} variant="dark">
			{isSubmitting ? 'Saving...' : contract ? 'Update Contract' : 'Create Contract'}
		</Button>
	</div>
</form>
