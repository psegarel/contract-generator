<script lang="ts">
	import type { EquipmentRentalContractFormState } from '$lib/state/v2/equipmentRentalContractFormState.svelte';

	interface Props {
		formState: EquipmentRentalContractFormState;
	}

	let { formState }: Props = $props();
</script>

<div class="bg-white p-6 rounded-lg border border-gray-200">
	<h3 class="text-lg font-semibold text-gray-900 mb-4">Rental Period</h3>
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<div>
			<label for="rentalStartDate" class="block text-sm font-medium text-gray-700 mb-1">
				Rental Start Date <span class="text-red-500">*</span>
			</label>
			<input
				id="rentalStartDate"
				type="date"
				bind:value={formState.rentalStartDate}
				required
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
			/>
		</div>

		<div>
			<label for="rentalEndDate" class="block text-sm font-medium text-gray-700 mb-1">
				Rental End Date <span class="text-red-500">*</span>
			</label>
			<input
				id="rentalEndDate"
				type="date"
				bind:value={formState.rentalEndDate}
				required
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
			/>
		</div>
	</div>
</div>
