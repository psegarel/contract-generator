<script lang="ts">
	import type { EventPlanningContractFormState } from '$lib/state/v2/eventPlanningContractFormState.svelte';

	interface Props {
		formState: EventPlanningContractFormState;
	}

	let { formState }: Props = $props();
</script>

<div class="bg-white p-6 rounded-lg border border-gray-200">
	<h3 class="text-lg font-semibold text-gray-900 mb-4">Contract Value & VAT</h3>
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<div>
			<label for="contractValueVND" class="block text-sm font-medium text-gray-700 mb-1">
				Contract Value (VND) <span class="text-red-500">*</span>
			</label>
			<input
				id="contractValueVND"
				type="number"
				bind:value={formState.contractValueVND}
				min="0"
				step="1000000"
				required
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				placeholder="100000000"
			/>
		</div>

		<div>
			<label for="vatRate" class="block text-sm font-medium text-gray-700 mb-1">
				VAT Rate (%) <span class="text-red-500">*</span>
			</label>
			<input
				id="vatRate"
				type="number"
				bind:value={formState.vatRate}
				min="0"
				max="100"
				step="0.1"
				required
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				placeholder="10"
			/>
		</div>
	</div>
</div>
