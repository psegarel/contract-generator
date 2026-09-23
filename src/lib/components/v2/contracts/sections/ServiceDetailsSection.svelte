<script lang="ts">
	import type { ServiceProvisionContractFormState } from '$lib/state/v2/serviceProvisionContractFormState.svelte';
	import TextField from '$lib/components/TextField.svelte';
	import TextareaField from '$lib/components/TextareaField.svelte';
	import FormSection from '$lib/components/FormSection.svelte';

	interface Props {
		formState: ServiceProvisionContractFormState;
	}

	let { formState }: Props = $props();
</script>

<FormSection title="Service Details">
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<TextField
			class="col-span-full"
			id="jobName"
			label="Job Name"
			bind:value={formState.jobName}
			required
			placeholder="DJ Services, Sound System Rental, etc."
		/>

		<TextareaField
			class="col-span-full"
			id="jobContent"
			label="Job Content"
			bind:value={formState.jobContent}
			required
			rows={4}
			placeholder="Detailed description of services provided..."
		/>

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

		<TextField id="endDate" label="End Date" type="date" bind:value={formState.endDate} required />

		<TextField
			class="col-span-full"
			id="eventLocation"
			label="Event Location"
			bind:value={formState.eventLocation}
			required
			placeholder="123 Main St, Ho Chi Minh City"
		/>
	</div>
</FormSection>
