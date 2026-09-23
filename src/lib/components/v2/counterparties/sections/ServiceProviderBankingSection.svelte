<script lang="ts">
	import TextField from '$lib/components/TextField.svelte';
	import FormSection from '$lib/components/FormSection.svelte';
	import BankNameCombobox from '$lib/components/v2/forms/BankNameCombobox.svelte';
	import type { ServiceProviderFormState } from '$lib/state/v2/serviceProviderFormState.svelte';

	let { formState }: { formState: ServiceProviderFormState } = $props();
</script>

<FormSection title="Tax & Banking">
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
		<TextField
			id="taxId"
			label="Tax ID"
			bind:value={formState.taxId}
			placeholder="Tax identification number"
		/>

		<TextField
			id="idDocument"
			label="ID Document Number"
			bind:value={formState.idDocument}
			placeholder="Passport/ID number"
		/>

		<BankNameCombobox id="bankName" label="Bank Name" bind:value={formState.bankName} />

		<TextField
			id="bankAccountNumber"
			label="Bank Account Number"
			bind:value={formState.bankAccountNumber}
			placeholder="1234567890"
		/>
	</div>
</FormSection>
