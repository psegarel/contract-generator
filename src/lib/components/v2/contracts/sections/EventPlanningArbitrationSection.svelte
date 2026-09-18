<script lang="ts">
	import type { EventPlanningContractFormState } from '$lib/state/v2/eventPlanningContractFormState.svelte';
	import FormSection from '$lib/components/FormSection.svelte';
	import TextField from '$lib/components/TextField.svelte';

	interface Props {
		formState: EventPlanningContractFormState;
	}

	let { formState }: Props = $props();
</script>

<FormSection title="Arbitration">
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<div>
			<TextField
				id="arbitrationLocation"
				label="Arbitration Location"
				bind:value={formState.arbitrationLocation}
				required
				placeholder="Ho Chi Minh City"
			/>
		</div>

		<div class="col-span-full">
			<TextField
				id="arbitrationLanguage"
				label="Arbitration Language"
				bind:value={formState.arbitrationLanguage}
				required
				placeholder="Vietnamese, English"
			/>
		</div>
	</div>
</FormSection>
