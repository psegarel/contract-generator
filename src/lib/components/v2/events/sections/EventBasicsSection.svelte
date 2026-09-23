<script lang="ts">
	import TextField from '$lib/components/TextField.svelte';
	import TextareaField from '$lib/components/TextareaField.svelte';
	import SelectField from '$lib/components/SelectField.svelte';
	import FormSection from '$lib/components/FormSection.svelte';
	import type { EventFormState } from '$lib/state/v2/eventFormState.svelte';

	let { formState }: { formState: EventFormState } = $props();
</script>

<FormSection title="Basic Information">
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
		<TextField
			id="name"
			label="Event Name"
			bind:value={formState.name}
			required
			placeholder="ABC Corp Annual Gala 2026"
			class="col-span-full"
		/>

		<TextField
			id="eventType"
			label="Event Type"
			bind:value={formState.eventType}
			placeholder="Corporate Event, Wedding, Concert"
		/>

		<SelectField id="status" label="Status" bind:value={formState.status} required>
			<option value="planning">Planning</option>
			<option value="confirmed">Confirmed</option>
			<option value="in-progress">In Progress</option>
			<option value="completed">Completed</option>
			<option value="cancelled">Cancelled</option>
		</SelectField>

		<TextareaField
			id="description"
			label="Description"
			bind:value={formState.description}
			rows={3}
			placeholder="Brief description of the event..."
			class="col-span-full"
		/>
	</div>
</FormSection>
