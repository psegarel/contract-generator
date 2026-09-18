<script lang="ts">
	import type { EventPlanningContractFormState } from '$lib/state/v2/eventPlanningContractFormState.svelte';
	import FormSection from '$lib/components/FormSection.svelte';
	import TextField from '$lib/components/TextField.svelte';

	interface Props {
		formState: EventPlanningContractFormState;
	}

	let { formState }: Props = $props();
</script>

<FormSection title="Legal Time Periods">
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<TextField
			id="paymentGracePeriodDays"
			label="Payment Grace Period (days)"
			type="number"
			bind:value={formState.paymentGracePeriodDays}
			min="1"
			step="1"
			required
			placeholder="30"
		/>

		<TextField
			id="terminationNoticeDays"
			label="Termination Notice Period (days)"
			type="number"
			bind:value={formState.terminationNoticeDays}
			min="1"
			step="1"
			required
			placeholder="7"
		/>

		<TextField
			id="negotiationPeriodDays"
			label="Negotiation Period (days)"
			type="number"
			bind:value={formState.negotiationPeriodDays}
			min="1"
			step="1"
			required
			placeholder="14"
		/>
	</div>
</FormSection>
