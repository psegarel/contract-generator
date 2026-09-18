<script lang="ts">
	import type { ServiceProvisionContractFormState } from '$lib/state/v2/serviceProvisionContractFormState.svelte';
	import TextField from '$lib/components/TextField.svelte';
	import FormSection from '$lib/components/FormSection.svelte';

	interface Props {
		formState: ServiceProvisionContractFormState;
	}

	let { formState }: Props = $props();
</script>

<FormSection title="Client Information (for PDF)">
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
</FormSection>
