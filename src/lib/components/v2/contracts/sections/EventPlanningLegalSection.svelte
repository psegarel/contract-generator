<script lang="ts">
	import FormSection from '$lib/components/FormSection.svelte';
	import TextField from '$lib/components/TextField.svelte';

	interface Props {
		paymentGracePeriodDays: number;
		terminationNoticeDays: number;
		negotiationPeriodDays: number;
		arbitrationLocation: string;
		arbitrationLanguage: string;
		onpaymentGracePeriodDaysChange: (value: number) => void;
		onterminationNoticeDaysChange: (value: number) => void;
		onnegotiationPeriodDaysChange: (value: number) => void;
		onarbitrationLocationChange: (value: string) => void;
		onarbitrationLanguageChange: (value: string) => void;
	}

	let {
		paymentGracePeriodDays,
		terminationNoticeDays,
		negotiationPeriodDays,
		arbitrationLocation,
		arbitrationLanguage,
		onpaymentGracePeriodDaysChange,
		onterminationNoticeDaysChange,
		onnegotiationPeriodDaysChange,
		onarbitrationLocationChange,
		onarbitrationLanguageChange
	}: Props = $props();
</script>

<FormSection title="Legal Terms">
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<TextField
			id="paymentGracePeriodDays"
			label="Payment Grace Period (days)"
			type="number"
			value={paymentGracePeriodDays}
			oninput={(e) => onpaymentGracePeriodDaysChange(Number(e.currentTarget.value))}
			min={1}
			step={1}
			required
			placeholder="30"
		/>

		<TextField
			id="terminationNoticeDays"
			label="Termination Notice Period (days)"
			type="number"
			value={terminationNoticeDays}
			oninput={(e) => onterminationNoticeDaysChange(Number(e.currentTarget.value))}
			min={1}
			step={1}
			required
			placeholder="7"
		/>

		<TextField
			id="negotiationPeriodDays"
			label="Negotiation Period (days)"
			type="number"
			value={negotiationPeriodDays}
			oninput={(e) => onnegotiationPeriodDaysChange(Number(e.currentTarget.value))}
			min={1}
			step={1}
			required
			placeholder="14"
		/>

		<TextField
			id="arbitrationLocation"
			label="Arbitration Location"
			value={arbitrationLocation}
			oninput={(e) => onarbitrationLocationChange(e.currentTarget.value)}
			required
			placeholder="Ho Chi Minh City"
		/>

		<TextField
			class="col-span-full"
			id="arbitrationLanguage"
			label="Arbitration Language"
			value={arbitrationLanguage}
			oninput={(e) => onarbitrationLanguageChange(e.currentTarget.value)}
			required
			placeholder="Vietnamese, English"
		/>
	</div>
</FormSection>
