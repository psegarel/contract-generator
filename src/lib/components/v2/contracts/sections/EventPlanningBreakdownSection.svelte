<script lang="ts">
	import type { EventPlanningContractFormState } from '$lib/state/v2/eventPlanningContractFormState.svelte';

	interface Props {
		formState: EventPlanningContractFormState;
	}

	let { formState }: Props = $props();
</script>

<div class="bg-white p-6 rounded-lg border border-gray-200">
	<h3 class="text-lg font-semibold text-gray-900 mb-4">Breakdown</h3>
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<div class="col-span-full">
			<label
				for="breakdownCompletionDateTime"
				class="block text-sm font-medium text-gray-700 mb-1"
			>
				Breakdown Completion Date/Time <span class="text-red-500">*</span>
			</label>
			<input
				id="breakdownCompletionDateTime"
				type="datetime-local"
				bind:value={formState.breakdownCompletionDateTime}
				required
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
			/>
		</div>
	</div>
</div>
