<script lang="ts">
	interface Props {
		netFee: number;
		taxRate: number;
		onnetFeeChange: (value: number) => void;
		ontaxRateChange: (value: number) => void;
	}

	let { netFee, taxRate, onnetFeeChange, ontaxRateChange }: Props = $props();

	// Calculate derived values
	let contractValue = $derived(Math.round(netFee / (1 - taxRate / 100)));
	let taxAmount = $derived(contractValue - netFee);

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
	};
</script>

<div class="bg-white p-6 rounded-lg border border-gray-200">
	<h3 class="text-lg font-semibold text-gray-900 mb-4">Financial Details</h3>
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<div>
			<label for="netFee" class="block text-sm font-medium text-gray-700 mb-1">
				Net Fee (after tax) <span class="text-red-500">*</span>
			</label>
			<input
				id="netFee"
				type="number"
				value={netFee}
				oninput={(e) => onnetFeeChange(Number(e.currentTarget.value))}
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
				value={taxRate}
				oninput={(e) => ontaxRateChange(Number(e.currentTarget.value))}
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
					<span class="text-gray-600">Contract Value (gross):</span>
					<span class="font-semibold text-gray-900">{formatCurrency(contractValue)}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-600">Tax Amount ({taxRate}%):</span>
					<span class="font-semibold text-gray-900">{formatCurrency(taxAmount)}</span>
				</div>
				<div class="flex justify-between pt-2 border-t border-gray-300">
					<span class="text-gray-700 font-medium">Net Fee (after tax):</span>
					<span class="font-bold text-blue-600">{formatCurrency(netFee)}</span>
				</div>
			</div>
		</div>
	</div>
</div>
