<script lang="ts">
	import { financialTermsSchema, type FinancialTerms } from '$lib/schemas/eventPlanningContract';
	import { validateWithSchema } from '$lib/utils/eventPlanningFormHelpers';
	import TextField from '$lib/components/TextField.svelte';

	let {
		data,
		onChange
	}: {
		data: FinancialTerms;
		onChange: (data: FinancialTerms, errors: Record<string, string>) => void;
	} = $props();

	let errors = $state<Record<string, string>>({});
	let touched = $state<Record<string, boolean>>({});

	function handleChange(field: keyof FinancialTerms, value: string) {
		touched = { ...touched, [field]: true };
		const numValue = value === '' ? 0 : Number(value);
		const newData = { ...data, [field]: numValue };
		const validation = validateWithSchema(financialTermsSchema, newData, touched);
		errors = validation.displayErrors;
		onChange(newData, validation.allErrors);
	}
</script>

<div class="p-6 bg-white rounded-lg border border-gray-200">
	<h3 class="text-lg font-semibold text-gray-900 mb-6">Financial Terms</h3>

	<div class="grid gap-6 grid-cols-[repeat(auto-fit,minmax(250px,1fr))]">
		<TextField
			id="contractValueVND"
			label="Contract Value (VND)"
			type="number"
			value={String(data.contractValueVND)}
			required={true}
			placeholder="e.g., 50000000"
			helperText="Total contract value in Vietnamese Dong"
			error={errors.contractValueVND}
			onInput={(value) => handleChange('contractValueVND', value)}
		/>

		<TextField
			id="vatRate"
			label="VAT Rate (%)"
			type="number"
			value={String(data.vatRate)}
			required={true}
			placeholder="e.g., 10"
			helperText="Value Added Tax rate (0-100)"
			error={errors.vatRate}
			onInput={(value) => handleChange('vatRate', value)}
		/>

		<TextField
			id="depositPercentage"
			label="Deposit Percentage (%)"
			type="number"
			value={String(data.depositPercentage)}
			required={true}
			placeholder="e.g., 30"
			helperText="Percentage of total to be paid as deposit"
			error={errors.depositPercentage}
			onInput={(value) => handleChange('depositPercentage', value)}
		/>

		<TextField
			id="finalPaymentPercentage"
			label="Final Payment Percentage (%)"
			type="number"
			value={String(data.finalPaymentPercentage)}
			required={true}
			placeholder="e.g., 70"
			helperText="Percentage of total for final payment (must sum to 100% with deposit)"
			error={errors.finalPaymentPercentage}
			onInput={(value) => handleChange('finalPaymentPercentage', value)}
		/>

		<TextField
			id="professionalIndemnityAmount"
			label="Professional Indemnity Insurance (VND)"
			type="number"
			value={String(data.professionalIndemnityAmount)}
			required={true}
			placeholder="e.g., 5000000"
			helperText="Professional indemnity insurance amount"
			error={errors.professionalIndemnityAmount}
			onInput={(value) => handleChange('professionalIndemnityAmount', value)}
		/>

		<TextField
			id="publicLiabilityAmount"
			label="Public Liability Insurance (VND)"
			type="number"
			value={String(data.publicLiabilityAmount)}
			required={true}
			placeholder="e.g., 10000000"
			helperText="Public liability insurance amount"
			error={errors.publicLiabilityAmount}
			onInput={(value) => handleChange('publicLiabilityAmount', value)}
		/>
	</div>
</div>
