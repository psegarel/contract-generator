<script lang="ts">
	import type { ServiceProvisionContractFormState } from '$lib/state/v2/serviceProvisionContractFormState.svelte';
	import TextField from '$lib/components/TextField.svelte';

	interface Props {
		formState: ServiceProvisionContractFormState;
	}

	let { formState }: Props = $props();
</script>

<div class="bg-white p-6 rounded-lg border border-gray-200">
	<h3 class="text-lg font-semibold text-gray-900 mb-4">Client Information (for PDF)</h3>
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<TextField
			id="clientEmail"
			label="Client Email"
			type="email"
			bind:value={formState.clientEmail}
			required
			placeholder="client@example.com"
		/>

		<TextField
			id="clientPhone"
			label="Client Phone"
			type="tel"
			bind:value={formState.clientPhone}
			required
			placeholder="+84 123 456 789"
		/>

		<TextField
			class="col-span-full"
			id="clientAddress"
			label="Client Address"
			bind:value={formState.clientAddress}
			required
			placeholder="123 Main St, Ho Chi Minh City"
		/>

		<TextField
			id="clientIdDocument"
			label="Client ID Document"
			bind:value={formState.clientIdDocument}
			required
			placeholder="ID or Passport number"
		/>

		<TextField
			id="clientTaxId"
			label="Client Tax ID"
			bind:value={formState.clientTaxId}
			placeholder="Tax identification number"
		/>
	</div>
</div>
