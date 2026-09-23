<script lang="ts">
	import TextField from '$lib/components/TextField.svelte';
	import TextareaField from '$lib/components/TextareaField.svelte';
	import FormSection from '$lib/components/FormSection.svelte';
	import type { PerformerFormState } from '$lib/state/v2/performerFormState.svelte';

	let { formState }: { formState: PerformerFormState } = $props();
</script>

<FormSection title="Performance Requirements">
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
		<TextareaField
			id="technicalRider"
			label="Technical Rider"
			bind:value={formState.technicalRider}
			rows={3}
			placeholder="Equipment and setup requirements..."
			class="col-span-full"
		/>

		<TextField
			id="minPerformanceDuration"
			label="Min Performance Duration (minutes)"
			type="number"
			value={formState.minPerformanceDuration ?? ''}
			oninput={(event) => {
				const value = (event.target as HTMLInputElement).value;
				formState.minPerformanceDuration = value ? Number(value) : null;
			}}
			placeholder="120"
		/>

		<TextField
			id="travelRequirements"
			label="Travel Requirements"
			bind:value={formState.travelRequirements}
			placeholder="Flight + hotel, local only, etc."
		/>
	</div>
</FormSection>
