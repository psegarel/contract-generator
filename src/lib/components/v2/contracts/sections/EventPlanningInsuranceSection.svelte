<script lang="ts">
	import type { EventPlanningContractFormState } from '$lib/state/v2/eventPlanningContractFormState.svelte';

	interface Props {
		formState: EventPlanningContractFormState;
	}

	let { formState }: Props = $props();
</script>

<div class="bg-white p-6 rounded-lg border border-gray-200">
	<h3 class="text-lg font-semibold text-gray-900 mb-4">Insurance</h3>
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<div>
			<label
				for="professionalIndemnityAmount"
				class="block text-sm font-medium text-gray-700 mb-1"
			>
				Professional Indemnity Amount <span class="text-red-500">*</span>
			</label>
			<input
				id="professionalIndemnityAmount"
				type="number"
				bind:value={formState.professionalIndemnityAmount}
				min="0"
				step="1000000"
				required
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				placeholder="5000000"
			/>
		</div>

		<div>
			<label for="publicLiabilityAmount" class="block text-sm font-medium text-gray-700 mb-1">
				Public Liability Amount <span class="text-red-500">*</span>
			</label>
			<input
				id="publicLiabilityAmount"
				type="number"
				bind:value={formState.publicLiabilityAmount}
				min="0"
				step="1000000"
				required
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				placeholder="10000000"
			/>
		</div>
	</div>
</div>
