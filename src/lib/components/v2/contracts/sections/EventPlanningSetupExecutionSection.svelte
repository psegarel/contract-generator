<script lang="ts">
	import type { EventPlanningContractFormState } from '$lib/state/v2/eventPlanningContractFormState.svelte';
	import TextField from '$lib/components/TextField.svelte';

	interface Props {
		formState: EventPlanningContractFormState;
	}

	let { formState }: Props = $props();
</script>

<div class="bg-white p-6 rounded-lg border border-gray-200">
	<h3 class="text-lg font-semibold text-gray-900 mb-4">Setup & Execution</h3>
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<div>
			<label for="technicalSetupDate" class="block text-sm font-medium text-gray-700 mb-1">
				Technical Setup Date <span class="text-red-500">*</span>
			</label>
			<input
				id="technicalSetupDate"
				type="date"
				bind:value={formState.technicalSetupDate}
				required
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
			/>
		</div>

		<div>
			<label for="eventExecutionDate" class="block text-sm font-medium text-gray-700 mb-1">
				Event Execution Date <span class="text-red-500">*</span>
			</label>
			<input
				id="eventExecutionDate"
				type="date"
				bind:value={formState.eventExecutionDate}
				required
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
			/>
		</div>

		<div>
			<label for="setupCommencementTime" class="block text-sm font-medium text-gray-700 mb-1">
				Setup Commencement Time <span class="text-red-500">*</span>
			</label>
			<input
				id="setupCommencementTime"
				type="time"
				bind:value={formState.setupCommencementTime}
				required
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
			/>
		</div>

		<div>
			<TextField
				id="eventExecutionDuration"
				label="Event Execution Duration"
				bind:value={formState.eventExecutionDuration}
				required
				placeholder="8 hours, 2 days, etc."
			/>
		</div>
	</div>
</div>
