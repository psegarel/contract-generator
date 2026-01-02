<script lang="ts">
	import type { EventPlanningContractData } from '$lib/schemas/eventPlanningContract';
	import { getInitialFormData } from '$lib/utils/eventPlanningFormHelpers';
	import ContractInfoSection from './event-planning/ContractInfoSection.svelte';
	import ClientInfoSection from './event-planning/ClientInfoSection.svelte';
	import EventDetailsSection from './event-planning/EventDetailsSection.svelte';
	import FinancialTermsSection from './event-planning/FinancialTermsSection.svelte';
	import TimelineSection from './event-planning/TimelineSection.svelte';
	import LegalTermsSection from './event-planning/LegalTermsSection.svelte';

	/**
	 * EventPlanningContractForm - Orchestrator Component
	 *
	 * Composes all 6 section components into a complete form.
	 * Manages overall state and validation.
	 */

	let {
		onSubmit,
		initialData = null
	}: {
		onSubmit: (data: EventPlanningContractData) => void | Promise<void>;
		initialData?: EventPlanningContractData | null;
	} = $props();

	// Helper to get initial form data (avoids state_referenced_locally warning)
	function getFormData() {
		return initialData ?? getInitialFormData();
	}

	// Form data state - initialized with provided data or defaults
	let formData = $state(getFormData());

	// Validation errors for each section
	let contractInfoErrors = $state<Record<string, string>>({});
	let clientInfoErrors = $state<Record<string, string>>({});
	let eventInfoErrors = $state<Record<string, string>>({});
	let financialTermsErrors = $state<Record<string, string>>({});
	let timelineErrors = $state<Record<string, string>>({});
	let legalTermsErrors = $state<Record<string, string>>({});

	// Form is valid when all sections have no errors
	let isValid = $derived(
		Object.keys(contractInfoErrors).length === 0 &&
			Object.keys(clientInfoErrors).length === 0 &&
			Object.keys(eventInfoErrors).length === 0 &&
			Object.keys(financialTermsErrors).length === 0 &&
			Object.keys(timelineErrors).length === 0 &&
			Object.keys(legalTermsErrors).length === 0
	);

	let isSubmitting = $state(false);

	// Handle changes from each section
	function handleContractInfoChange(
		data: typeof formData.contractDate extends string
			? { contractDate: string; contractLocation: string }
			: never,
		errors: Record<string, string>
	) {
		formData = { ...formData, ...data };
		contractInfoErrors = errors;
	}

	function handleClientInfoChange(
		data: {
			clientCompany: string;
			clientAddress: string;
			clientTaxCode: string;
			clientRepresentativeName: string;
			clientRepresentativePosition: string;
		},
		errors: Record<string, string>
	) {
		formData = { ...formData, ...data };
		clientInfoErrors = errors;
	}

	function handleEventInfoChange(
		data: {
			eventTheme: string | null;
			eventName: string;
			eventType: string | null;
			eventDescription: string | null;
			eventVenue: string;
			eventDate: string;
			eventDuration: string | null;
			expectedAttendance: string | null;
		},
		errors: Record<string, string>
	) {
		formData = { ...formData, ...data };
		eventInfoErrors = errors;
	}

	function handleFinancialTermsChange(
		data: {
			contractValueVND: number;
			vatRate: number;
			depositPercentage: number;
			finalPaymentPercentage: number;
			professionalIndemnityAmount: number;
			publicLiabilityAmount: number;
		},
		errors: Record<string, string>
	) {
		formData = { ...formData, ...data };
		financialTermsErrors = errors;
	}

	function handleTimelineChange(
		data: {
			planningMeetingDays: number;
			performerBookingDeadline: string;
			technicalSetupDate: string;
			eventExecutionDate: string;
			setupCommencementTime: string;
			eventExecutionDuration: string;
			breakdownCompletionDateTime: string;
		},
		errors: Record<string, string>
	) {
		formData = { ...formData, ...data };
		timelineErrors = errors;
	}

	function handleLegalTermsChange(
		data: {
			paymentGracePeriodDays: number;
			terminationNoticeDays: number;
			negotiationPeriodDays: number;
			arbitrationLocation: string;
			arbitrationLanguage: string;
		},
		errors: Record<string, string>
	) {
		formData = { ...formData, ...data };
		legalTermsErrors = errors;
	}

	async function handleSubmit() {
		if (!isValid || isSubmitting) return;

		isSubmitting = true;
		try {
			await onSubmit(formData);
		} finally {
			isSubmitting = false;
		}
	}
</script>

<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="max-w-6xl mx-auto p-8">
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900 mb-2">Event Planning Contract</h1>
		<p class="text-gray-600">Complete all required fields to generate your contract</p>
	</div>

	<div class="grid gap-6">
		<ContractInfoSection
			data={{
				contractDate: formData.contractDate,
				contractLocation: formData.contractLocation
			}}
			onChange={handleContractInfoChange}
		/>

		<ClientInfoSection
			data={{
				clientCompany: formData.clientCompany,
				clientAddress: formData.clientAddress,
				clientTaxCode: formData.clientTaxCode,
				clientRepresentativeName: formData.clientRepresentativeName,
				clientRepresentativePosition: formData.clientRepresentativePosition
			}}
			onChange={handleClientInfoChange}
		/>

		<EventDetailsSection
			data={{
				eventTheme: formData.eventTheme,
				eventName: formData.eventName,
				eventType: formData.eventType,
				eventDescription: formData.eventDescription,
				eventVenue: formData.eventVenue,
				eventDate: formData.eventDate,
				eventDuration: formData.eventDuration,
				expectedAttendance: formData.expectedAttendance
			}}
			onChange={handleEventInfoChange}
		/>

		<FinancialTermsSection
			data={{
				contractValueVND: formData.contractValueVND,
				vatRate: formData.vatRate,
				depositPercentage: formData.depositPercentage,
				finalPaymentPercentage: formData.finalPaymentPercentage,
				professionalIndemnityAmount: formData.professionalIndemnityAmount,
				publicLiabilityAmount: formData.publicLiabilityAmount
			}}
			onChange={handleFinancialTermsChange}
		/>

		<TimelineSection
			data={{
				planningMeetingDays: formData.planningMeetingDays,
				performerBookingDeadline: formData.performerBookingDeadline,
				technicalSetupDate: formData.technicalSetupDate,
				eventExecutionDate: formData.eventExecutionDate,
				setupCommencementTime: formData.setupCommencementTime,
				eventExecutionDuration: formData.eventExecutionDuration,
				breakdownCompletionDateTime: formData.breakdownCompletionDateTime
			}}
			onChange={handleTimelineChange}
		/>

		<LegalTermsSection
			data={{
				paymentGracePeriodDays: formData.paymentGracePeriodDays,
				terminationNoticeDays: formData.terminationNoticeDays,
				negotiationPeriodDays: formData.negotiationPeriodDays,
				arbitrationLocation: formData.arbitrationLocation,
				arbitrationLanguage: formData.arbitrationLanguage
			}}
			onChange={handleLegalTermsChange}
		/>

		<div class="flex gap-4 justify-end pt-4 border-t border-gray-200">
			<button
				type="submit"
				disabled={!isValid || isSubmitting}
				class="px-6 py-3 bg-blue-600 text-white rounded-md font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 focus:outline-none focus:ring-[3px] focus:ring-blue-500/10"
			>
				{isSubmitting ? 'Generating Contract...' : 'Generate Contract'}
			</button>
		</div>
	</div>
</form>