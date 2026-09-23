<script lang="ts">
	import TextareaField from '$lib/components/TextareaField.svelte';
	import FormSection from '$lib/components/FormSection.svelte';
	import type { EventFormState } from '$lib/state/v2/eventFormState.svelte';

	let { formState }: { formState: EventFormState } = $props();
</script>

<FormSection title="Internal Notes">
	<TextareaField
		id="internalNotes"
		label="Internal Notes"
		bind:value={formState.internalNotes}
		rows={4}
		placeholder="Internal notes for planning, coordination, etc..."
	/>
</FormSection>
