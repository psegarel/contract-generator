<script lang="ts">
	import TextareaField from '$lib/components/TextareaField.svelte';
	import FormSection from '$lib/components/FormSection.svelte';

	let {
		value = $bindable(''),
		placeholder
	}: {
		value?: string;
		placeholder: string;
	} = $props();
</script>

<FormSection title="Notes">
	<TextareaField id="notes" label="" bind:value rows={4} {placeholder} />
</FormSection>
