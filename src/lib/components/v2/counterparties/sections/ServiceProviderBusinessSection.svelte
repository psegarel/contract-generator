<script lang="ts">
	import TextField from '$lib/components/TextField.svelte';
	import FormSection from '$lib/components/FormSection.svelte';
	import type { ServiceProviderFormState } from '$lib/state/v2/serviceProviderFormState.svelte';

	let { formState }: { formState: ServiceProviderFormState } = $props();
</script>

<FormSection title="Business Information">
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
		<TextField
			id="businessLicense"
			label="Business License"
			bind:value={formState.businessLicense}
			placeholder="License number"
		/>

		<TextField
			id="insuranceInfo"
			label="Insurance Information"
			bind:value={formState.insuranceInfo}
			placeholder="Insurance details"
		/>
	</div>
</FormSection>
