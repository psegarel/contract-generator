<script lang="ts">
	import type { ServiceProvisionContractFormState } from '$lib/state/v2/serviceProvisionContractFormState.svelte';
	import { formatCurrency } from '$lib/utils/formatting';
	import TextField from '$lib/components/TextField.svelte';

	interface Props {
		formState: ServiceProvisionContractFormState;
	}

	let { formState }: Props = $props();

	// Calculate derived values for display
	// Gross amount = contractValue / (1 - taxRate/100)
	let grossAmount = $derived(Math.round(formState.contractValue / (1 - formState.taxRate / 100)));
	let taxAmount = $derived(grossAmount - formState.contractValue);
</script>

<div class="bg-white p-6 rounded-lg border border-gray-200">
	<h3 class="text-lg font-semibold text-gray-900 mb-4">Financial Details</h3>
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<TextField
			id="contractValue"
			label="Contract Value (before tax)"
			type="number"
			bind:value={formState.contractValue}
			min="0"
			step="1000"
			required
			placeholder="10000000"
		/>

		<TextField
			id="taxRate"
			label="Tax Rate (%)"
			type="number"
			bind:value={formState.taxRate}
			min="0"
			max="100"
			step="0.1"
			required
			placeholder="10"
		/>

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

		<TextField
			class="col-span-full"
			id="paymentDueDate"
			label="Payment Due Date"
			type="date"
			bind:value={formState.paymentDueDate}
			required
			helperText="The date by which payment must be made"
		/>
	</div>
</div>
