<script lang="ts">
	import type { EventPlanningContractFormState } from '$lib/state/v2/eventPlanningContractFormState.svelte';
	import FormSection from '$lib/components/FormSection.svelte';
	import TextField from '$lib/components/TextField.svelte';
	import TextareaField from '$lib/components/TextareaField.svelte';

	interface Props {
		formState: EventPlanningContractFormState;
	}

	let { formState }: Props = $props();
</script>

<FormSection title="Company Information">
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<div class="col-span-full">
			<TextField
				id="clientCompany"
				label="Company Name"
				bind:value={formState.clientCompany}
				required
				placeholder="ABC Corporation Ltd"
			/>
		</div>

		<div class="col-span-full">
			<TextareaField
				id="clientAddress"
				label="Address"
				bind:value={formState.clientAddress}
				required
				placeholder="123 Main St, Ho Chi Minh City"
			/>
		</div>

		<div>
			<TextField
				id="clientTaxCode"
				label="Tax Code"
				bind:value={formState.clientTaxCode}
				required
				placeholder="Tax identification number"
			/>
		</div>
	</div>
</FormSection>
