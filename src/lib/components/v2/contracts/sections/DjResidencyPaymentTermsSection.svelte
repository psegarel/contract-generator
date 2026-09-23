<script lang="ts">
	import TextField from '$lib/components/TextField.svelte';
	import FormSection from '$lib/components/FormSection.svelte';
	import { DjResidencyContractFormState } from '$lib/state/v2/djResidencyContractFormState.svelte';

	interface Props {
		formState: DjResidencyContractFormState;
	}

	let { formState }: Props = $props();
</script>

<FormSection title="Payment Terms">
	<div class="grid gap-6 grid-cols-1 md:grid-cols-2">
		<TextField
			id="performanceFeeVND"
			label="Hourly Rate — Client (VND)"
			type="number"
			bind:value={formState.performanceFeeVND}
			min="0"
			required
		/>
		<TextField
			id="terminationNoticeDays"
			label="Termination Notice (days)"
			type="number"
			bind:value={formState.terminationNoticeDays}
			min="1"
			required
		/>
	</div>
	<div class="mt-4 bg-muted p-4">
		<p class="text-sm text-muted-foreground">
			The client is billed at the hourly rate for the actual hours recorded in the performance log.
		</p>
	</div>
</FormSection>
