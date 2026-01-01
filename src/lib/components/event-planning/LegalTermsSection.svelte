<script lang="ts">
	import { legalTermsSchema, type LegalTerms } from '$lib/schemas/eventPlanningContract';
	import { validateWithSchema } from '$lib/utils/eventPlanningFormHelpers';
	import TextField from '$lib/components/TextField.svelte';

	let {
		data,
		onChange
	}: {
		data: LegalTerms;
		onChange: (data: LegalTerms, errors: Record<string, string>) => void;
	} = $props();

	let errors = $state<Record<string, string>>({});
	let touched = $state<Record<string, boolean>>({});

	function handleChange(field: keyof LegalTerms, value: string) {
		touched = { ...touched, [field]: true };
		const numberFields = ['paymentGracePeriodDays', 'terminationNoticeDays', 'negotiationPeriodDays'];
		const newData = numberFields.includes(field)
			? { ...data, [field]: value === '' ? 0 : Number(value) }
			: { ...data, [field]: value };
		const validation = validateWithSchema(legalTermsSchema, newData, touched);
		errors = validation.displayErrors;
		onChange(newData as LegalTerms, validation.allErrors);
	}
</script>

<div class="p-6 bg-white rounded-lg border border-gray-200">
	<h3 class="text-lg font-semibold text-gray-900 mb-6">Legal Terms</h3>

	<div class="grid gap-6 grid-cols-[repeat(auto-fit,minmax(250px,1fr))]">
		<TextField
			id="paymentGracePeriodDays"
			label="Payment Grace Period (Days)"
			type="number"
			value={String(data.paymentGracePeriodDays)}
			required={true}
			placeholder="e.g., 30"
			helperText="Grace period for late payments before penalties"
			error={errors.paymentGracePeriodDays}
			onInput={(value) => handleChange('paymentGracePeriodDays', value)}
		/>

		<TextField
			id="terminationNoticeDays"
			label="Termination Notice Period (Days)"
			type="number"
			value={String(data.terminationNoticeDays)}
			required={true}
			placeholder="e.g., 30"
			helperText="Notice period required to terminate contract"
			error={errors.terminationNoticeDays}
			onInput={(value) => handleChange('terminationNoticeDays', value)}
		/>

		<TextField
			id="negotiationPeriodDays"
			label="Negotiation Period (Days)"
			type="number"
			value={String(data.negotiationPeriodDays)}
			required={true}
			placeholder="e.g., 30"
			helperText="Period for negotiation before arbitration"
			error={errors.negotiationPeriodDays}
			onInput={(value) => handleChange('negotiationPeriodDays', value)}
		/>

		<TextField
			id="arbitrationLocation"
			label="Arbitration Location"
			value={data.arbitrationLocation}
			required={true}
			placeholder="e.g., Danang, Vietnam"
			helperText="Location for dispute arbitration"
			error={errors.arbitrationLocation}
			onInput={(value) => handleChange('arbitrationLocation', value)}
		/>

		<TextField
			id="arbitrationLanguage"
			label="Arbitration Language"
			value={data.arbitrationLanguage}
			required={true}
			placeholder="e.g., English / Tiếng Anh"
			helperText="Language(s) for arbitration proceedings"
			error={errors.arbitrationLanguage}
			onInput={(value) => handleChange('arbitrationLanguage', value)}
		/>
	</div>
</div>
