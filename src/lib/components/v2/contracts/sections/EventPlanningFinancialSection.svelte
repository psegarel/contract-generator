<script lang="ts">
	interface Props {
		contractValueVND: number;
		vatRate: number;
		depositPercentage: number;
		finalPaymentPercentage: number;
		professionalIndemnityAmount: number;
		publicLiabilityAmount: number;
		oncontractValueVNDChange: (value: number) => void;
		onvatRateChange: (value: number) => void;
		ondepositPercentageChange: (value: number) => void;
		onfinalPaymentPercentageChange: (value: number) => void;
		onprofessionalIndemnityAmountChange: (value: number) => void;
		onpublicLiabilityAmountChange: (value: number) => void;
	}

	import { formatCurrency } from '$lib/utils/formatting';

	let {
		contractValueVND,
		vatRate,
		depositPercentage,
		finalPaymentPercentage,
		professionalIndemnityAmount,
		publicLiabilityAmount,
		oncontractValueVNDChange,
		onvatRateChange,
		ondepositPercentageChange,
		onfinalPaymentPercentageChange,
		onprofessionalIndemnityAmountChange,
		onpublicLiabilityAmountChange
	}: Props = $props();

	let depositAmount = $derived(contractValueVND * (depositPercentage / 100));
	let finalPaymentAmount = $derived(contractValueVND * (finalPaymentPercentage / 100));
	let paymentsSumTo100 = $derived(depositPercentage + finalPaymentPercentage === 100);
</script>

<div class="bg-white p-6 rounded-lg border border-gray-200">
	<h3 class="text-lg font-semibold text-gray-900 mb-4">Financial Terms</h3>
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<div>
			<label for="contractValueVND" class="block text-sm font-medium text-gray-700 mb-1">
				Contract Value (VND) <span class="text-red-500">*</span>
			</label>
			<input
				id="contractValueVND"
				type="number"
				value={contractValueVND}
				oninput={(e) => oncontractValueVNDChange(Number(e.currentTarget.value))}
				min="0"
				step="1000000"
				required
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				placeholder="100000000"
			/>
		</div>

		<div>
			<label for="vatRate" class="block text-sm font-medium text-gray-700 mb-1">
				VAT Rate (%) <span class="text-red-500">*</span>
			</label>
			<input
				id="vatRate"
				type="number"
				value={vatRate}
				oninput={(e) => onvatRateChange(Number(e.currentTarget.value))}
				min="0"
				max="100"
				step="0.1"
				required
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				placeholder="10"
			/>
		</div>

		<div>
			<label for="depositPercentage" class="block text-sm font-medium text-gray-700 mb-1">
				Deposit Percentage <span class="text-red-500">*</span>
			</label>
			<input
				id="depositPercentage"
				type="number"
				value={depositPercentage}
				oninput={(e) => ondepositPercentageChange(Number(e.currentTarget.value))}
				min="0"
				max="100"
				step="1"
				required
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md {!paymentsSumTo100
					? 'border-red-500'
					: 'border-gray-300'} focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				placeholder="50"
			/>
			<p class="text-xs text-gray-500 mt-1">{formatCurrency(depositAmount)}</p>
		</div>

		<div>
			<label for="finalPaymentPercentage" class="block text-sm font-medium text-gray-700 mb-1">
				Final Payment Percentage <span class="text-red-500">*</span>
			</label>
			<input
				id="finalPaymentPercentage"
				type="number"
				value={finalPaymentPercentage}
				oninput={(e) => onfinalPaymentPercentageChange(Number(e.currentTarget.value))}
				min="0"
				max="100"
				step="1"
				required
				class="w-full px-3.5 py-2.5 border {!paymentsSumTo100
					? 'border-red-500'
					: 'border-gray-300'} rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				placeholder="50"
			/>
			<p class="text-xs text-gray-500 mt-1">{formatCurrency(finalPaymentAmount)}</p>
		</div>

		{#if !paymentsSumTo100}
			<div class="col-span-full p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
				Deposit and final payment percentages must sum to 100%
			</div>
		{/if}

		<div>
			<label for="professionalIndemnityAmount" class="block text-sm font-medium text-gray-700 mb-1">
				Professional Indemnity Amount <span class="text-red-500">*</span>
			</label>
			<input
				id="professionalIndemnityAmount"
				type="number"
				value={professionalIndemnityAmount}
				oninput={(e) => onprofessionalIndemnityAmountChange(Number(e.currentTarget.value))}
				min="0"
				step="1000000"
				required
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				placeholder="5000000"
			/>
		</div>

		<div>
			<label for="publicLiabilityAmount" class="block text-sm font-medium text-gray-700 mb-1">
				Public Liability Amount <span class="text-red-500">*</span>
			</label>
			<input
				id="publicLiabilityAmount"
				type="number"
				value={publicLiabilityAmount}
				oninput={(e) => onpublicLiabilityAmountChange(Number(e.currentTarget.value))}
				min="0"
				step="1000000"
				required
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				placeholder="10000000"
			/>
		</div>
	</div>
</div>
