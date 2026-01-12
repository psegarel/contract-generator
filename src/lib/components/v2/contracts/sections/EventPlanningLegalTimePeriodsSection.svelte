<script lang="ts">
	import type { EventPlanningContractFormState } from '$lib/state/v2/eventPlanningContractFormState.svelte';

	interface Props {
		formState: EventPlanningContractFormState;
	}

	let { formState }: Props = $props();
</script>

<div class="bg-white p-6 rounded-lg border border-gray-200">
	<h3 class="text-lg font-semibold text-gray-900 mb-4">Legal Time Periods</h3>
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<div>
			<label for="paymentGracePeriodDays" class="block text-sm font-medium text-gray-700 mb-1">
				Payment Grace Period (days) <span class="text-red-500">*</span>
			</label>
			<input
				id="paymentGracePeriodDays"
				type="number"
				bind:value={formState.paymentGracePeriodDays}
				min="1"
				step="1"
				required
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				placeholder="30"
			/>
		</div>

		<div>
			<label for="terminationNoticeDays" class="block text-sm font-medium text-gray-700 mb-1">
				Termination Notice Period (days) <span class="text-red-500">*</span>
			</label>
			<input
				id="terminationNoticeDays"
				type="number"
				bind:value={formState.terminationNoticeDays}
				min="1"
				step="1"
				required
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				placeholder="7"
			/>
		</div>

		<div>
			<label for="negotiationPeriodDays" class="block text-sm font-medium text-gray-700 mb-1">
				Negotiation Period (days) <span class="text-red-500">*</span>
			</label>
			<input
				id="negotiationPeriodDays"
				type="number"
				bind:value={formState.negotiationPeriodDays}
				min="1"
				step="1"
				required
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				placeholder="14"
			/>
		</div>
	</div>
</div>
