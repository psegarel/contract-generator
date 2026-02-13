<script lang="ts">
	import type { EventPlanningContractFormState } from '$lib/state/v2/eventPlanningContractFormState.svelte';
	import TextField from '$lib/components/TextField.svelte';

	interface Props {
		formState: EventPlanningContractFormState;
	}

	let { formState }: Props = $props();
</script>

<div class="bg-white p-6 rounded-lg border border-gray-200">
	<h3 class="text-lg font-semibold text-gray-900 mb-4">Contract Value & VAT</h3>
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<TextField
			id="contractValueVND"
			label="Contract Value (VND)"
			type="number"
			bind:value={formState.contractValueVND}
			min="0"
			step="1000000"
			required
			placeholder="100000000"
		/>

		<TextField
			id="vatRate"
			label="VAT Rate (%)"
			type="number"
			bind:value={formState.vatRate}
			min="0"
			max="100"
			step="0.1"
			required
			placeholder="10"
		/>
	</div>
</div>
