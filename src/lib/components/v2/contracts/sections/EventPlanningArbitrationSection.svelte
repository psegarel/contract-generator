<script lang="ts">
	import type { EventPlanningContractFormState } from '$lib/state/v2/eventPlanningContractFormState.svelte';
	import TextField from '$lib/components/TextField.svelte';

	interface Props {
		formState: EventPlanningContractFormState;
	}

	let { formState }: Props = $props();
</script>

<div class="bg-white p-6 rounded-lg border border-gray-200">
	<h3 class="text-lg font-semibold text-gray-900 mb-4">Arbitration</h3>
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
</div>
