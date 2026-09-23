<script lang="ts">
	import type { ClientCounterparty } from '$lib/types/v2';
	import { Button } from '$lib/components/ui/button';
	import SelectField from '$lib/components/SelectField.svelte';
	import TextField from '$lib/components/TextField.svelte';
	import FormSection from '$lib/components/FormSection.svelte';
	import { DjResidencyContractFormState } from '$lib/state/v2/djResidencyContractFormState.svelte';

	interface Props {
		formState: DjResidencyContractFormState;
		venueCounterparties: ClientCounterparty[];
		onCreateCounterparty: () => void;
	}

	let { formState, venueCounterparties, onCreateCounterparty }: Props = $props();
</script>

<FormSection title="Contract Information">
	<div class="grid gap-6 grid-cols-1 md:grid-cols-2">
		<TextField
			id="contractNumber"
			label="Contract Number"
			bind:value={formState.contractNumber}
			required
		/>
		<div class="flex items-end gap-2">
			<SelectField
				class="flex-1"
				id="counterpartyId"
				label="Party B"
				bind:value={formState.counterpartyId}
				required
			>
				<option value="">Select counterparty</option>
				{#each venueCounterparties as venue (venue.id)}
					<option value={venue.id}>{venue.name}</option>
				{/each}
			</SelectField>
			<Button
				type="button"
				variant="outline"
				class="mb-1 whitespace-nowrap bg-primary/5 text-primary hover:bg-primary/10"
				onclick={onCreateCounterparty}
			>
				+ Create New
			</Button>
		</div>
	</div>
</FormSection>
