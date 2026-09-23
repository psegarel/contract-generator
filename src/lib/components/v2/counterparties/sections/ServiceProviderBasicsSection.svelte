<script lang="ts">
	import TextField from '$lib/components/TextField.svelte';
	import FormSection from '$lib/components/FormSection.svelte';
	import type { ServiceProviderFormState } from '$lib/state/v2/serviceProviderFormState.svelte';

	let { formState }: { formState: ServiceProviderFormState } = $props();
</script>

<FormSection title="Basic Information">
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
		<TextField
			id="name"
			label="Name"
			bind:value={formState.name}
			required
			placeholder="ABC Catering Services"
			class="col-span-full"
		/>

		<TextField
			id="serviceType"
			label="Service Type"
			bind:value={formState.serviceType}
			required
			placeholder="Catering, Photography, Security, AV Equipment"
		/>

		<TextField
			id="companyName"
			label="Company Name"
			bind:value={formState.companyName}
			placeholder="ABC Corporation Ltd"
		/>

		<TextField
			id="email"
			label="Email"
			type="email"
			bind:value={formState.email}
			placeholder="contact@example.com"
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
