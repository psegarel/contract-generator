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

	let { formState, counterparties, onCreateCounterpartyClick, onCounterpartyChange }: Props = $props();
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

		<div>
			<div class="flex items-center justify-between mb-1">
				<label for="counterpartyId" class="block text-sm font-medium text-foreground">
					Counterparty <span class="text-destructive">*</span>
				</label>
				<Button
					variant="link"
					size="sm"
					class="h-auto p-0 text-sm"
					onclick={() => onCreateCounterpartyClick?.()}
				>
					+ Create New
				</Button>
			</div>
			<select
				id="counterpartyId"
				bind:value={formState.counterpartyId}
				onchange={() => onCounterpartyChange?.()}
				required
				class="w-full px-3.5 py-2.5 border border-input rounded-md bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring transition-all text-sm"
			>
				<option value="">Select a counterparty</option>
				{#each counterparties as counterparty (counterparty.id)}
					<option value={counterparty.id}>{counterparty.name}</option>
				{/each}
			</select>
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
