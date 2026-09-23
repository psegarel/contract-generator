<script lang="ts">
	import TextField from '$lib/components/TextField.svelte';
	import FormSection from '$lib/components/FormSection.svelte';
	import type { ClientFormState } from '$lib/state/v2/clientFormState.svelte';

	let { formState }: { formState: ClientFormState } = $props();
</script>

<FormSection title="Company Details">
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
		<TextField
			id="companyName"
			label="Company Name"
			bind:value={formState.companyName}
			placeholder="ABC Corporation Ltd"
			class="col-span-full"
		/>

		<TextField
			id="representativeName"
			label="Representative Name"
			bind:value={formState.representativeName}
			placeholder="John Doe"
		/>

		<TextField
			id="representativePosition"
			label="Representative Position"
			bind:value={formState.representativePosition}
			placeholder="CEO, Director"
		/>
	</div>
</FormSection>
