<script lang="ts">
	import type { EquipmentRentalContractFormState } from '$lib/state/v2/equipmentRentalContractFormState.svelte';
	import type { Counterparty } from '$lib/types/v2';
	import TextField from '$lib/components/TextField.svelte';
	import SelectField from '$lib/components/SelectField.svelte';
	import FormSection from '$lib/components/FormSection.svelte';
	import { Button } from '$lib/components/ui/button';

	interface Props {
		formState: EquipmentRentalContractFormState;
		counterparties: Counterparty[];
		onCreateCounterpartyClick?: () => void;
		onCounterpartyChange?: () => void;
	}

	let { formState, counterparties, onCreateCounterpartyClick, onCounterpartyChange }: Props =
		$props();
</script>

<FormSection title="Contract Basics">
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<div>
			<TextField
				id="contractNumber"
				label="Contract Number"
				bind:value={formState.contractNumber}
				placeholder="EQP-20260104-1234"
			/>
		</div>

		<div class="flex items-end gap-2">
			<SelectField
				class="flex-1"
				id="counterpartyId"
				label="Counterparty"
				bind:value={formState.counterpartyId}
				onchange={() => onCounterpartyChange?.()}
				required
			>
				<option value="">Select a counterparty</option>
				{#each counterparties as counterparty (counterparty.id)}
					<option value={counterparty.id}>{counterparty.name}</option>
				{/each}
			</SelectField>
			<Button
				variant="link"
				size="sm"
				class="mb-1 h-auto p-0 text-sm whitespace-nowrap"
				onclick={() => onCreateCounterpartyClick?.()}
			>
				+ Create New
			</Button>
		</div>

		<SelectField
			id="paymentStatus"
			label="Payment Status"
			bind:value={formState.paymentStatus}
			required
		>
			<option value="unpaid">Unpaid</option>
			<option value="paid">Paid</option>
		</SelectField>
	</div>
</FormSection>
