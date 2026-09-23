<script lang="ts">
	import TextField from '$lib/components/TextField.svelte';
	import SelectField from '$lib/components/SelectField.svelte';
	import FormSection from '$lib/components/FormSection.svelte';
	import type { ClientFormState } from '$lib/state/v2/clientFormState.svelte';

	let { formState }: { formState: ClientFormState } = $props();
</script>

<FormSection title="Basic Information">
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
		<TextField
			id="name"
			label="Name"
			bind:value={formState.name}
			required
			placeholder="John Doe or ABC Corporation"
			class="col-span-full"
		/>

		<SelectField id="clientType" label="Client Type" bind:value={formState.clientType} required>
			<option value="individual">Individual</option>
			<option value="company">Company</option>
		</SelectField>

		<TextField
			id="email"
			label="Email"
			type="email"
			bind:value={formState.email}
			placeholder="client@example.com"
		/>

		<TextField
			id="phone"
			label="Phone"
			type="tel"
			bind:value={formState.phone}
			placeholder="+84 123 456 789"
		/>

		<TextField
			id="address"
			label="Address"
			bind:value={formState.address}
			placeholder="123 Main St, Ho Chi Minh City"
			class="col-span-full"
		/>
	</div>
</FormSection>
