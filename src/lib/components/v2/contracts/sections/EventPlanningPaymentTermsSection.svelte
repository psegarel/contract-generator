<script lang="ts">
	import type { EventPlanningContractFormState } from '$lib/state/v2/eventPlanningContractFormState.svelte';
	import { formatCurrency } from '$lib/utils/formatting';
	import TextField from '$lib/components/TextField.svelte';

	interface Props {
		formState: EventPlanningContractFormState;
	}

	let { formState }: Props = $props();

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
		<TextField
			id="depositPercentage"
			label="Deposit Percentage"
			type="number"
			bind:value={formState.depositPercentage}
			min="0"
			max="100"
			step="1"
			required
			placeholder="50"
			error={!paymentsSumTo100 ? ' ' : ''}
			helperText={formatCurrency(depositAmount)}
		/>

		<TextField
			id="finalPaymentPercentage"
			label="Final Payment Percentage"
			type="number"
			bind:value={formState.finalPaymentPercentage}
			min="0"
			max="100"
			step="1"
			required
			placeholder="50"
			error={!paymentsSumTo100 ? ' ' : ''}
			helperText={formatCurrency(finalPaymentAmount)}
		/>

		{#if !paymentsSumTo100}
			<div class="col-span-full p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
				Deposit and final payment percentages must sum to 100%
			</div>
		{/if}

		<TextField
			class="col-span-full"
			id="paymentDueDate"
			label="Payment Due Date"
			type="date"
			bind:value={formState.paymentDueDate}
			required
			helperText="The date by which payment must be received"
		/>
	</div>
</div>
