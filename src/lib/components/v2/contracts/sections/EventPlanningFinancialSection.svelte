<script lang="ts">
	import FormSection from '$lib/components/FormSection.svelte';
	import FormMessage from '$lib/components/FormMessage.svelte';
	import TextField from '$lib/components/TextField.svelte';
	import { formatCurrency } from '$lib/utils/formatting';

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

<FormSection title="Financial Terms">
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<TextField
			id="contractValueVND"
			label="Contract Value (VND)"
			type="number"
			value={contractValueVND}
			oninput={(e) => oncontractValueVNDChange(Number(e.currentTarget.value))}
			min={0}
			step={1000000}
			required
			placeholder="100000000"
		/>

		<TextField
			id="vatRate"
			label="VAT Rate (%)"
			type="number"
			value={vatRate}
			oninput={(e) => onvatRateChange(Number(e.currentTarget.value))}
			min={0}
			max={100}
			step={0.1}
			required
			placeholder="10"
		/>

		<div>
			<TextField
				id="depositPercentage"
				label="Deposit Percentage"
				type="number"
				value={depositPercentage}
				oninput={(e) => ondepositPercentageChange(Number(e.currentTarget.value))}
				min={0}
				max={100}
				step={1}
				required
				placeholder="50"
				error={!paymentsSumTo100 ? ' ' : ''}
			/>
			<p class="text-xs text-muted-foreground mt-1">{formatCurrency(depositAmount)}</p>
		</div>

		<div>
			<TextField
				id="finalPaymentPercentage"
				label="Final Payment Percentage"
				type="number"
				value={finalPaymentPercentage}
				oninput={(e) => onfinalPaymentPercentageChange(Number(e.currentTarget.value))}
				min={0}
				max={100}
				step={1}
				required
				placeholder="50"
				error={!paymentsSumTo100 ? ' ' : ''}
			/>
			<p class="text-xs text-muted-foreground mt-1">{formatCurrency(finalPaymentAmount)}</p>
		</div>

		{#if !paymentsSumTo100}
			<FormMessage
				message="Deposit and final payment percentages must sum to 100%"
				variant="error"
			/>
		{/if}

		<TextField
			id="professionalIndemnityAmount"
			label="Professional Indemnity Amount"
			type="number"
			value={professionalIndemnityAmount}
			oninput={(e) => onprofessionalIndemnityAmountChange(Number(e.currentTarget.value))}
			min={0}
			step={1000000}
			required
			placeholder="5000000"
		/>

		<TextField
			id="publicLiabilityAmount"
			label="Public Liability Amount"
			type="number"
			value={publicLiabilityAmount}
			oninput={(e) => onpublicLiabilityAmountChange(Number(e.currentTarget.value))}
			min={0}
			step={1000000}
			required
			placeholder="10000000"
		/>
	</div>
</FormSection>
