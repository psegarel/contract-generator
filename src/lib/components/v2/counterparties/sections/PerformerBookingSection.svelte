<script lang="ts">
	import TextField from '$lib/components/TextField.svelte';
	import FormSection from '$lib/components/FormSection.svelte';
	import type { PerformerFormState } from '$lib/state/v2/performerFormState.svelte';

	let { formState }: { formState: PerformerFormState } = $props();
</script>

<FormSection title="Booking Details">
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
		<TextField
			id="agentName"
			label="Agent Name"
			bind:value={formState.agentName}
			placeholder="Booking agent name"
		/>

		<TextField
			id="agentContact"
			label="Agent Contact"
			bind:value={formState.agentContact}
			placeholder="Email or phone"
		/>
	</div>
</FormSection>
