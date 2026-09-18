<script lang="ts">
	import type { EventPlanningContractFormState } from '$lib/state/v2/eventPlanningContractFormState.svelte';
	import { formatCurrency } from '$lib/utils/formatting';
	import FormSection from '$lib/components/FormSection.svelte';
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

<FormSection title="Payment Terms">
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
			<div class="col-span-full p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
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
</FormSection>
