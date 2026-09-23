<script lang="ts">
	import TextField from '$lib/components/TextField.svelte';
	import FormSection from '$lib/components/FormSection.svelte';
	import type { ClientFormState } from '$lib/state/v2/clientFormState.svelte';

	let { formState }: { formState: ClientFormState } = $props();
</script>

<FormSection title="Individual Details">
	<TextField
		id="idDocument"
		label="ID Document (Passport/ID Number)"
		bind:value={formState.idDocument}
		placeholder="123456789"
	/>
</FormSection>
