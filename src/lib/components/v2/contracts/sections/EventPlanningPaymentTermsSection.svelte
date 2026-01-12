<script lang="ts">
	import type { EventPlanningContractFormState } from '$lib/state/v2/eventPlanningContractFormState.svelte';

	interface Props {
		formState: EventPlanningContractFormState;
	}

	let { formState }: Props = $props();

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
	};

	let depositAmount = $derived(
		formState.contractValueVND * (formState.depositPercentage / 100)
	);
	let finalPaymentAmount = $derived(
		formState.contractValueVND * (formState.finalPaymentPercentage / 100)
	);
	let paymentsSumTo100 = $derived(
		formState.depositPercentage + formState.finalPaymentPercentage === 100
	);
</script>

<div class="bg-white p-6 rounded-lg border border-gray-200">
	<h3 class="text-lg font-semibold text-gray-900 mb-4">Payment Terms</h3>
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<div>
			<label for="depositPercentage" class="block text-sm font-medium text-gray-700 mb-1">
				Deposit Percentage <span class="text-red-500">*</span>
			</label>
			<input
				id="depositPercentage"
				type="number"
				bind:value={formState.depositPercentage}
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
				bind:value={formState.finalPaymentPercentage}
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
	</div>
</div>
