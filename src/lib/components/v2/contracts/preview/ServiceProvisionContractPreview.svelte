<script lang="ts">
	import type { ServiceProvisionContractViewData } from '$lib/utils/v2/contractDataTransformers';

	interface Props {
		data: ServiceProvisionContractViewData;
	}

	let { data }: Props = $props();
</script>

<!-- Contract Document Preview - Styled to match Word document -->
<div class="bg-white text-gray-900 font-serif max-w-4xl mx-auto p-8 print:p-0">
	<!-- Header: Contract Number -->
	<div class="text-center mb-8">
		<h1 class="text-2xl font-bold mb-2">SERVICE CONTRACT</h1>
		<p class="text-lg">Contract Number: {data.contractNumber}</p>
	</div>

	<!-- Company Information (Party A) -->
	<div class="mb-6">
		<h2 class="text-lg font-semibold mb-3">PARTY A (SERVICE PROVIDER)</h2>
		<div class="space-y-1 text-sm leading-relaxed">
			<p><strong>Company Name:</strong> {data.companyName}</p>
			<p>
				<strong>Address:</strong> {data.companyAddressLine1}, {data.companyAddressLine2}, {data.companyWard}, {data.companyCity}
			</p>
			<p><strong>Tax Code:</strong> {data.companyTaxCode}</p>
			<p>
				<strong>Representative:</strong> {data.companyRepresentative} - {data.companyFunction}
			</p>
			<p><strong>Phone:</strong> {data.companyRepresentativePhone}</p>
			<p><strong>Email:</strong> {data.companyRepresentativeEmail}</p>
		</div>
	</div>

	<!-- Client Information (Party B) -->
	<div class="mb-6">
		<h2 class="text-lg font-semibold mb-3">PARTY B (CLIENT/STAFF)</h2>
		<div class="space-y-1 text-sm leading-relaxed">
			<p><strong>Name:</strong> {data.clientName}</p>
			<p><strong>Email:</strong> {data.clientEmail}</p>
			<p><strong>Address:</strong> {data.clientAddress}</p>
			<p><strong>Phone:</strong> {data.clientPhone}</p>
			<p><strong>ID Document:</strong> {data.clientIdDocument}</p>
			<p><strong>Tax ID:</strong> {data.clientTaxId}</p>
		</div>
	</div>

	<!-- Bank Details -->
	<div class="mb-6">
		<h2 class="text-lg font-semibold mb-3">BANKING INFORMATION</h2>
		<div class="space-y-1 text-sm leading-relaxed">
			<p><strong>Bank Name:</strong> {data.bankName}</p>
			<p><strong>Account Number:</strong> {data.accountNumber}</p>
		</div>
	</div>

	<!-- Event Details -->
	<div class="mb-6">
		<h2 class="text-lg font-semibold mb-3">EVENT DETAILS</h2>
		<div class="space-y-1 text-sm leading-relaxed">
			<p><strong>Job Name:</strong> {data.jobName} ({data.jobNameVN})</p>
			{#if data.eventName}
				<p><strong>Event Name:</strong> {data.eventName}</p>
			{/if}
			<p><strong>Number of Performances:</strong> {data.numberOfPerformances}</p>
			<p><strong>Event Location:</strong> {data.eventLocation}</p>
			<p><strong>First Performance Time:</strong> {data.firstPerformanceTime}</p>
			<div class="mt-2">
				<p><strong>Job Content:</strong></p>
				<div class="pl-4 border-l-2 border-gray-300">
					<p class="whitespace-pre-wrap">{data.jobContent}</p>
					<p class="whitespace-pre-wrap text-gray-700 italic mt-2">{data.jobContentVN}</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Financial Information -->
	<div class="mb-6">
		<h2 class="text-lg font-semibold mb-3">FINANCIAL TERMS</h2>
		<div class="space-y-1 text-sm leading-relaxed">
			<p><strong>Net Fee:</strong> {data.netFee} VND</p>
			<p><strong>Tax Rate:</strong> {data.taxRate}%</p>
			<p><strong>Tax Amount:</strong> {data.taxAmount} VND</p>
			<p><strong>Gross Fee (Total):</strong> {data.grossFee} VND</p>
		</div>
	</div>

	<!-- Contract Period -->
	<div class="mb-6">
		<h2 class="text-lg font-semibold mb-3">CONTRACT PERIOD</h2>
		<div class="space-y-1 text-sm leading-relaxed">
			<p><strong>Start Date:</strong> {data.startDate}</p>
			<p><strong>End Date:</strong> {data.endDate}</p>
		</div>
	</div>

	<!-- Signature Section -->
	<div class="mt-12 grid grid-cols-2 gap-8">
		<div>
			<p class="text-sm font-semibold mb-2">PARTY A</p>
			<div class="border-t-2 border-gray-900 mt-16 pt-2">
				<p class="text-sm">{data.companyRepresentative}</p>
				<p class="text-xs text-gray-600">{data.companyFunction}</p>
			</div>
		</div>
		<div>
			<p class="text-sm font-semibold mb-2">PARTY B</p>
			<div class="border-t-2 border-gray-900 mt-16 pt-2">
				<p class="text-sm">{data.clientName}</p>
			</div>
		</div>
	</div>
</div>

