<script lang="ts">
	import type { ServiceProvisionContractFormState } from '$lib/state/v2/serviceProvisionContractFormState.svelte';
	import TextField from '$lib/components/TextField.svelte';
	import BankNameCombobox from '$lib/components/v2/forms/BankNameCombobox.svelte';
	import FormSection from '$lib/components/FormSection.svelte';

	interface Props {
		formState: ServiceProvisionContractFormState;
	}

	let { formState }: Props = $props();
</script>

<FormSection title="Banking Information">
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<BankNameCombobox id="bankName" label="Bank Name" bind:value={formState.bankName} required />

		<TextField
			id="accountNumber"
			label="Account Number"
			bind:value={formState.accountNumber}
			required
			placeholder="1234567890"
		/>
	</div>
</FormSection>
