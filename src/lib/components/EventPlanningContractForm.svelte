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

<form novalidate onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-12">

	<!-- Primary Grid: Contract, Client, Timeline vs Event Details -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
		<!-- Left Column -->
		<div class="space-y-8">
			<!-- Contract Info Section - Soft Peach -->
			<div class="p-10 rounded-[2.5rem] space-y-8" style="background-color: oklch(0.96 0.02 40);">
				<ContractInfoSection
					data={{
						contractDate: formData.contractDate,
						contractLocation: formData.contractLocation
					}}
					onChange={handleContractInfoChange}
				/>
			</div>

			<!-- Client Info Section - Soft Sky Blue -->
			<div class="p-10 rounded-[2.5rem] space-y-8" style="background-color: oklch(0.96 0.02 230);">
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
			</div>

			<!-- Timeline Section - Soft Amber -->
			<div class="p-10 rounded-[2.5rem] space-y-8" style="background-color: oklch(0.96 0.02 60);">
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
			</div>
		</div>

		<!-- Right Column -->
		<div class="space-y-8">
			<!-- Event Details Section - Soft Lavender -->
			<div class="p-10 rounded-[2.5rem] space-y-8" style="background-color: oklch(0.96 0.02 280);">
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
			</div>
		</div>
	</div>

	<!-- Secondary Grid: Legal Terms vs Financial Terms & Submit -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
		<!-- Left Column -->
		<div class="space-y-8">
			<!-- Legal Terms Section - Soft Charcoal -->
			<div class="p-10 rounded-[2.5rem] space-y-8" style="background-color: oklch(0.92 0.005 280);">
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
			</div>
		</div>

		<!-- Right Column -->
		<div class="space-y-8">
			<!-- Financial Terms Section - Sage Green -->
			<div class="p-10 rounded-[2.5rem] space-y-8" style="background-color: oklch(0.96 0.02 150);">
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
			</div>

			<div class="flex gap-4 justify-end pt-4">
				<button
					type="submit"
					disabled={!isValid || isSubmitting}
					class="px-8 h-12 text-white rounded-2xl font-bold text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99] focus:outline-none focus:ring-4 focus:ring-primary/10"
					style="background-color: oklch(0.3 0.01 280);"
				>
					{isSubmitting ? 'Generating Contract...' : 'Generate Contract'}
				</button>
			</div>
		</div>
	</div>
</form>