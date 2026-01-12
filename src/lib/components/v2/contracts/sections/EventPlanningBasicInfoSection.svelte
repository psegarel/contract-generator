<script lang="ts">
	import type { EventPlanningContractFormState } from '$lib/state/v2/eventPlanningContractFormState.svelte';
	import TextField from '$lib/components/TextField.svelte';
	import TextareaField from '$lib/components/TextareaField.svelte';

	interface Props {
		formState: EventPlanningContractFormState;
	}

	let { formState }: Props = $props();
</script>

<div class="bg-white p-6 rounded-lg border border-gray-200">
	<h3 class="text-lg font-semibold text-gray-900 mb-4">Basic Event Information</h3>
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<div>
			<TextField
				id="eventTheme"
				label="Event Theme"
				bind:value={formState.eventTheme}
				placeholder="Corporate Gala, Wedding, etc."
			/>
		</div>

		<div>
			<TextField
				id="eventType"
				label="Event Type"
				bind:value={formState.eventType}
				placeholder="Conference, Celebration, etc."
			/>
		</div>

		<div class="col-span-full">
			<TextareaField
				id="eventDescription"
				label="Event Description"
				bind:value={formState.eventDescription}
				rows={3}
				placeholder="Detailed description of the event..."
			/>
		</div>
	</div>
</div>
