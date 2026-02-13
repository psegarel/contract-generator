<script lang="ts">
	import type { ServiceProvisionContractFormState } from '$lib/state/v2/serviceProvisionContractFormState.svelte';
	import TextField from '$lib/components/TextField.svelte';

	interface Props {
		formState: ServiceProvisionContractFormState;
	}

	let { formState }: Props = $props();
</script>

<div class="bg-white p-6 rounded-lg border border-gray-200">
	<h3 class="text-lg font-semibold text-gray-900 mb-4">Service Details</h3>
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<TextField
			class="col-span-full"
			id="jobName"
			label="Job Name"
			bind:value={formState.jobName}
			required
			placeholder="DJ Services, Sound System Rental, etc."
		/>

		<div class="col-span-full">
			<label for="jobContent" class="block text-sm font-medium text-gray-700 mb-1">
				Job Content <span class="text-red-500">*</span>
			</label>
			<textarea
				id="jobContent"
				bind:value={formState.jobContent}
				required
				rows="4"
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				placeholder="Detailed description of services provided..."
			></textarea>
		</div>

		<TextField
			id="numberOfPerformances"
			label="Number of Performances"
			type="number"
			bind:value={formState.numberOfPerformances}
			min="1"
			required
		/>

		<TextField
			id="firstPerformanceTime"
			label="First Performance Time"
			type="time"
			bind:value={formState.firstPerformanceTime}
			required
		/>

		<TextField
			id="startDate"
			label="Start Date"
			type="date"
			bind:value={formState.startDate}
			required
		/>

		<TextField
			id="endDate"
			label="End Date"
			type="date"
			bind:value={formState.endDate}
			required
		/>

		<TextField
			class="col-span-full"
			id="eventLocation"
			label="Event Location"
			bind:value={formState.eventLocation}
			required
			placeholder="123 Main St, Ho Chi Minh City"
		/>
	</div>
</div>
