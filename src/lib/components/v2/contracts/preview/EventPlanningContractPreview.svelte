<script lang="ts">
	import type { EventPlanningContractViewData } from '$lib/utils/v2/contractDataTransformers';

	interface Props {
		data: EventPlanningContractViewData;
	}

	let { data }: Props = $props();
</script>

<!-- Event Planning Contract Document Preview - Styled to match Word document -->
<div class="bg-white text-gray-900 font-serif max-w-4xl mx-auto p-8 print:p-0">
	<!-- Header: Contract Number and Date -->
	<div class="text-center mb-8">
		<h1 class="text-2xl font-bold mb-2">EVENT PLANNING SERVICES CONTRACT</h1>
		<p class="text-lg mb-1">Contract Number: {data.contractNumber}</p>
		<p class="text-sm">
			Date: {data.contractDateEnglish} / {data.contractDateVietnamese}
		</p>
		<p class="text-sm mt-1">Location: {data.contractLocationEnglish} / {data.contractLocationVietnamese}</p>
	</div>

	<!-- Client Information (Party A) - Bilingual -->
	<div class="mb-6">
		<h2 class="text-lg font-semibold mb-3">PARTY A (CLIENT)</h2>
		<div class="space-y-1 text-sm leading-relaxed">
			<p>
				<strong>Company:</strong> {data.clientCompanyEnglish} / {data.clientCompanyVietnamese}
			</p>
			<p>
				<strong>Address:</strong> {data.clientAddressEnglish} / {data.clientAddressVietnamese}
			</p>
			<p><strong>Tax Code:</strong> {data.clientTaxCode}</p>
			<p>
				<strong>Representative:</strong> {data.clientRepresentativeName}
			</p>
			<p>
				<strong>Position:</strong> {data.clientRepresentativePositionEnglish} / {data.clientRepresentativePositionVietnamese}
			</p>
		</div>
	</div>

	<!-- Event Information - Bilingual -->
	<div class="mb-6">
		<h2 class="text-lg font-semibold mb-3">EVENT INFORMATION</h2>
		<div class="space-y-1 text-sm leading-relaxed">
			{#if data.eventThemeEnglish}
				<p>
					<strong>Theme:</strong> {data.eventThemeEnglish} / {data.eventThemeVietnamese}
				</p>
			{/if}
			{#if data.eventName}
				<p><strong>Event Name:</strong> {data.eventName}</p>
			{/if}
			{#if data.eventTypeEnglish}
				<p>
					<strong>Type:</strong> {data.eventTypeEnglish} / {data.eventTypeVietnamese}
				</p>
			{/if}
			{#if data.eventDescriptionEnglish}
				<div class="mt-2">
					<p><strong>Description:</strong></p>
					<div class="pl-4 border-l-2 border-gray-300">
						<p class="whitespace-pre-wrap">{data.eventDescriptionEnglish}</p>
						<p class="whitespace-pre-wrap text-gray-700 italic mt-2">{data.eventDescriptionVietnamese}</p>
					</div>
				</div>
			{/if}
			<p>
				<strong>Venue:</strong> {data.eventVenueEnglish} / {data.eventVenueVietnamese}
			</p>
			<p>
				<strong>Date:</strong> {data.eventDateEnglish} / {data.eventDateVietnamese}
			</p>
			{#if data.eventDurationEnglish}
				<p>
					<strong>Duration:</strong> {data.eventDurationEnglish} / {data.eventDurationVietnamese}
				</p>
			{/if}
			{#if data.expectedAttendance}
				<p><strong>Expected Attendance:</strong> {data.expectedAttendance}</p>
			{/if}
		</div>
	</div>

	<!-- Financial Terms -->
	<div class="mb-6">
		<h2 class="text-lg font-semibold mb-3">FINANCIAL TERMS</h2>
		<div class="space-y-1 text-sm leading-relaxed">
			<p><strong>Contract Value:</strong> {data.contractValueVND} VND</p>
			<p><strong>VAT Rate:</strong> {data.vatRate}</p>
			<p><strong>Deposit:</strong> {data.depositPercentage}</p>
			<p><strong>Final Payment:</strong> {data.finalPaymentPercentage}</p>
			<p><strong>Professional Indemnity:</strong> {data.professionalIndemnityAmount} VND</p>
			<p><strong>Public Liability:</strong> {data.publicLiabilityAmount} VND</p>
		</div>
	</div>

	<!-- Timeline -->
	<div class="mb-6">
		<h2 class="text-lg font-semibold mb-3">TIMELINE</h2>
		<div class="space-y-1 text-sm leading-relaxed">
			<p><strong>Planning Meeting:</strong> {data.planningMeetingDays} days before event</p>
			<p><strong>Performer Booking Deadline:</strong> {data.performerBookingDeadline}</p>
			<p><strong>Technical Setup Date:</strong> {data.technicalSetupDate}</p>
			<p><strong>Event Execution Date:</strong> {data.eventExecutionDate}</p>
			<p><strong>Setup Commencement Time:</strong> {data.setupCommencementTime}</p>
			<p><strong>Event Execution Duration:</strong> {data.eventExecutionDuration}</p>
			<p><strong>Breakdown Completion:</strong> {data.breakdownCompletionDateTime}</p>
		</div>
	</div>

	<!-- Legal Terms -->
	<div class="mb-6">
		<h2 class="text-lg font-semibold mb-3">LEGAL TERMS</h2>
		<div class="space-y-1 text-sm leading-relaxed">
			<p><strong>Payment Grace Period:</strong> {data.paymentGracePeriodDays} days</p>
			<p><strong>Termination Notice:</strong> {data.terminationNoticeDays} days</p>
			<p><strong>Negotiation Period:</strong> {data.negotiationPeriodDays} days</p>
			<p>
				<strong>Arbitration Location:</strong> {data.arbitrationLocationEnglish} / {data.arbitrationLocationVietnamese}
			</p>
			<p><strong>Arbitration Language:</strong> {data.arbitrationLanguage}</p>
		</div>
	</div>

	<!-- Signature Section -->
	<div class="mt-12 grid grid-cols-2 gap-8">
		<div>
			<p class="text-sm font-semibold mb-2">PARTY A (CLIENT)</p>
			<div class="border-t-2 border-gray-900 mt-16 pt-2">
				<p class="text-sm">{data.clientRepresentativeName}</p>
				<p class="text-xs text-gray-600">{data.clientRepresentativePositionEnglish}</p>
			</div>
		</div>
		<div>
			<p class="text-sm font-semibold mb-2">PARTY B (SERVICE PROVIDER)</p>
			<div class="border-t-2 border-gray-900 mt-16 pt-2">
				<p class="text-sm">INSENSE COMPANY LIMITED</p>
				<p class="text-xs text-gray-600">Representative</p>
			</div>
		</div>
	</div>
</div>

