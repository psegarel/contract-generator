<script lang="ts">
	import type { EventPlanningContractFormState } from '$lib/state/v2/eventPlanningContractFormState.svelte';
	import TextField from '$lib/components/TextField.svelte';

	interface Props {
		formState: EventPlanningContractFormState;
	}

	let { formState }: Props = $props();
</script>

<div class="bg-white p-6 rounded-lg border border-gray-200">
	<h3 class="text-lg font-semibold text-gray-900 mb-4">Insurance</h3>
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<TextField
			id="professionalIndemnityAmount"
			label="Professional Indemnity Amount"
			type="number"
			bind:value={formState.professionalIndemnityAmount}
			min="0"
			step="1000000"
			required
			placeholder="5000000"
		/>

		<TextField
			id="publicLiabilityAmount"
			label="Public Liability Amount"
			type="number"
			bind:value={formState.publicLiabilityAmount}
			min="0"
			step="1000000"
			required
			placeholder="10000000"
		/>
	</div>
</div>
