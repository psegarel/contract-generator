<script lang="ts">
	import type { ServiceProvisionContractFormState } from '$lib/state/v2/serviceProvisionContractFormState.svelte';

	interface Props {
		formState: ServiceProvisionContractFormState;
	}

	let { formState }: Props = $props();

	// Calculate derived values for display
	// Gross amount = contractValue / (1 - taxRate/100)
	let grossAmount = $derived(Math.round(formState.contractValue / (1 - formState.taxRate / 100)));
	let taxAmount = $derived(grossAmount - formState.contractValue);

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
	};
</script>

<div class="bg-white p-6 rounded-lg border border-gray-200">
	<h3 class="text-lg font-semibold text-gray-900 mb-4">Financial Details</h3>
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<div>
			<label for="contractValue" class="block text-sm font-medium text-gray-700 mb-1">
				Contract Value (before tax) <span class="text-red-500">*</span>
			</label>
			<input
				id="contractValue"
				type="number"
				bind:value={formState.contractValue}
				min="0"
				step="1000"
				required
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				placeholder="10000000"
			/>
		</div>

		<div>
			<label for="taxRate" class="block text-sm font-medium text-gray-700 mb-1">
				Tax Rate (%) <span class="text-red-500">*</span>
			</label>
			<input
				id="taxRate"
				type="number"
				bind:value={formState.taxRate}
				min="0"
				max="100"
				step="0.1"
				required
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				placeholder="10"
			/>
		</div>

		<div class="col-span-full p-4 bg-gray-50 rounded-md border border-gray-200">
			<div class="grid gap-2 text-sm">
				<div class="flex justify-between">
					<span class="text-gray-600">Contract Value (before tax):</span>
					<span class="font-semibold text-gray-900">{formatCurrency(formState.contractValue)}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-600">Tax Amount ({formState.taxRate}%):</span>
					<span class="font-semibold text-gray-900">{formatCurrency(taxAmount)}</span>
				</div>
				<div class="flex justify-between pt-2 border-t border-gray-300">
					<span class="text-gray-700 font-medium">Gross Amount (after tax added):</span>
					<span class="font-bold text-blue-600">{formatCurrency(grossAmount)}</span>
				</div>
			</div>
		</div>
	</div>
</div>
