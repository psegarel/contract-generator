<script lang="ts">
	import type { EquipmentRentalContractFormState } from '$lib/state/v2/equipmentRentalContractFormState.svelte';
	import type { Counterparty } from '$lib/types/v2';
	import TextField from '$lib/components/TextField.svelte';

	interface Props {
		formState: EquipmentRentalContractFormState;
		counterparties: Counterparty[];
		onCreateCounterpartyClick?: () => void;
		onCounterpartyChange?: () => void;
	}

	let { formState, counterparties, onCreateCounterpartyClick, onCounterpartyChange }: Props = $props();
</script>

<div class="bg-white p-6 rounded-lg border border-gray-200">
	<h3 class="text-lg font-semibold text-gray-900 mb-4">Contract Basics</h3>
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
				<label for="counterpartyId" class="block text-sm font-medium text-gray-700">
					Counterparty <span class="text-red-500">*</span>
				</label>
				<button
					type="button"
					onclick={() => onCreateCounterpartyClick?.()}
					class="text-sm text-blue-600 hover:text-blue-700 font-medium"
				>
					+ Create New
				</button>
			</div>
			<select
				id="counterpartyId"
				bind:value={formState.counterpartyId}
				onchange={() => onCounterpartyChange?.()}
				required
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
			>
				<option value="">Select a counterparty</option>
				{#each counterparties as counterparty (counterparty.id)}
					<option value={counterparty.id}>{counterparty.name}</option>
				{/each}
			</select>
		</div>

		<div>
			<label for="paymentStatus" class="block text-sm font-medium text-gray-700 mb-1">
				Payment Status <span class="text-red-500">*</span>
			</label>
			<select
				id="paymentStatus"
				bind:value={formState.paymentStatus}
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
			>
				<option value="unpaid">Unpaid</option>
				<option value="paid">Paid</option>
			</select>
		</div>
	</div>
</div>
