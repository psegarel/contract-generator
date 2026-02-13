<script lang="ts">
	import type { ServiceProvisionContractFormState } from '$lib/state/v2/serviceProvisionContractFormState.svelte';
	import TextField from '$lib/components/TextField.svelte';

	interface Props {
		formState: ServiceProvisionContractFormState;
	}

	let { formState }: Props = $props();
</script>

<div class="bg-white p-6 rounded-lg border border-gray-200">
	<h3 class="text-lg font-semibold text-gray-900 mb-4">Banking Information</h3>
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<TextField
			id="bankName"
			label="Bank Name"
			bind:value={formState.bankName}
			required
			placeholder="Vietcombank, Techcombank, etc."
		/>

		<TextField
			id="accountNumber"
			label="Account Number"
			bind:value={formState.accountNumber}
			required
			placeholder="1234567890"
		/>
	</div>
</div>
