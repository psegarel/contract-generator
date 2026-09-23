<script lang="ts">
	import TextField from '$lib/components/TextField.svelte';
	import FormSection from '$lib/components/FormSection.svelte';
	import BankNameCombobox from '$lib/components/v2/forms/BankNameCombobox.svelte';
	import type { PerformerFormState } from '$lib/state/v2/performerFormState.svelte';

	let { formState }: { formState: PerformerFormState } = $props();
</script>

<FormSection title="Payment Details">
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
		<BankNameCombobox id="bankName" label="Bank Name" bind:value={formState.bankName} />

		<TextField
			id="bankAccountNumber"
			label="Bank Account Number"
			bind:value={formState.bankAccountNumber}
			placeholder="1234567890"
		/>

		<TextField
			id="idDocument"
			label="ID Document (Passport/ID Number)"
			bind:value={formState.idDocument}
			placeholder="123456789"
		/>

		<TextField
			id="taxId"
			label="Tax ID"
			bind:value={formState.taxId}
			placeholder="Tax identification number"
		/>

		<TextField
			id="pitRate"
			label="PIT Rate (%)"
			type="number"
			bind:value={formState.pitRate}
			min="0"
			max="100"
			placeholder="10"
		/>
	</div>
</FormSection>
