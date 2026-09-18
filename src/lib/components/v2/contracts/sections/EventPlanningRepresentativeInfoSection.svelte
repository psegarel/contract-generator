<script lang="ts">
	import type { EventPlanningContractFormState } from '$lib/state/v2/eventPlanningContractFormState.svelte';
	import FormSection from '$lib/components/FormSection.svelte';
	import TextField from '$lib/components/TextField.svelte';

	interface Props {
		formState: EventPlanningContractFormState;
	}

	let { formState }: Props = $props();
</script>

<FormSection title="Representative Information">
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<div>
			<TextField
				id="clientRepresentativeName"
				label="Representative Name"
				bind:value={formState.clientRepresentativeName}
				required
				placeholder="John Doe"
			/>
		</div>

		<div class="col-span-full">
			<TextField
				id="clientRepresentativePosition"
				label="Representative Position"
				bind:value={formState.clientRepresentativePosition}
				required
				placeholder="CEO, Director, etc."
			/>
		</div>
	</div>
</FormSection>
