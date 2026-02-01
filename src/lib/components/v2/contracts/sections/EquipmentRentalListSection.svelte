<script lang="ts">
	import type { EquipmentRentalContractFormState } from '$lib/state/v2/equipmentRentalContractFormState.svelte';
	import type { EquipmentItem } from '$lib/types/v2';
	import { formatCurrency } from '$lib/utils/formatting';

	interface Props {
		formState: EquipmentRentalContractFormState;
	}

	let { formState }: Props = $props();

	function updateItem(index: number, field: keyof EquipmentItem, value: string | number) {
		const item = formState.equipment[index];
		if (!item) return;

		const updatedItem: EquipmentItem = {
			...item,
			[field]: value
		};
		formState.updateEquipmentItem(index, updatedItem);
	}

	function addSerialNumber(itemIndex: number) {
		const item = formState.equipment[itemIndex];
		if (!item) return;

		const updatedItem: EquipmentItem = {
			...item,
			serialNumbers: [...item.serialNumbers, '']
		};
		formState.updateEquipmentItem(itemIndex, updatedItem);
	}

	function updateSerialNumber(itemIndex: number, serialIndex: number, value: string) {
		const item = formState.equipment[itemIndex];
		if (!item) return;

		const updatedSerialNumbers = [...item.serialNumbers];
		updatedSerialNumbers[serialIndex] = value;

		const updatedItem: EquipmentItem = {
			...item,
			serialNumbers: updatedSerialNumbers
		};
		formState.updateEquipmentItem(itemIndex, updatedItem);
	}

	function removeSerialNumber(itemIndex: number, serialIndex: number) {
		const item = formState.equipment[itemIndex];
		if (!item) return;

		const updatedSerialNumbers = item.serialNumbers.filter((_, i) => i !== serialIndex);

		const updatedItem: EquipmentItem = {
			...item,
			serialNumbers: updatedSerialNumbers
		};
		formState.updateEquipmentItem(itemIndex, updatedItem);
	}
</script>

<div class="bg-white p-6 rounded-lg border border-gray-200">
	<div class="flex items-center justify-between mb-4">
		<h3 class="text-lg font-semibold text-gray-900">Equipment List</h3>
		<button
			type="button"
			onclick={() => formState.addEquipmentItem()}
			class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
		>
			+ Add Equipment
		</button>
	</div>

	{#if formState.equipment.length === 0}
		<p class="text-sm text-gray-500 italic">No equipment items added yet. Click "Add Equipment" to get started.</p>
	{:else}
		<div class="space-y-4">
			{#each formState.equipment as item, index (index)}
				<div class="p-4 border border-gray-200 rounded-md">
					<div class="flex items-center justify-between mb-3">
						<h4 class="text-sm font-semibold text-gray-900">Equipment Item #{index + 1}</h4>
						<button
							type="button"
							onclick={() => formState.removeEquipmentItem(index)}
							class="text-red-600 hover:text-red-700 text-sm font-medium"
						>
							Remove
						</button>
					</div>

					<div class="grid gap-4 grid-cols-1 md:grid-cols-3">
						<div>
							<label
								for="equipment-name-{index}"
								class="block text-sm font-medium text-gray-700 mb-1"
							>
								Equipment Name <span class="text-red-500">*</span>
							</label>
							<input
								id="equipment-name-{index}"
								type="text"
								value={item.name}
								oninput={(e) => updateItem(index, 'name', e.currentTarget.value)}
								required
								class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
								placeholder="e.g., Audio Mixer"
							/>
						</div>

						<div>
							<label
								for="equipment-quantity-{index}"
								class="block text-sm font-medium text-gray-700 mb-1"
							>
								Quantity <span class="text-red-500">*</span>
							</label>
							<input
								id="equipment-quantity-{index}"
								type="number"
								value={item.quantity}
								oninput={(e) => updateItem(index, 'quantity', Number(e.currentTarget.value))}
								min="1"
								required
								class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
							/>
						</div>

						<div>
							<label
								for="equipment-unitPrice-{index}"
								class="block text-sm font-medium text-gray-700 mb-1"
							>
								Unit Price (VND) <span class="text-red-500">*</span>
							</label>
							<input
								id="equipment-unitPrice-{index}"
								type="number"
								value={item.unitPrice}
								oninput={(e) => updateItem(index, 'unitPrice', Number(e.currentTarget.value))}
								min="0"
								step="1000"
								required
								class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
								placeholder="1000000"
							/>
							<p class="text-xs text-gray-500 mt-1">
								Total: {formatCurrency(item.quantity * item.unitPrice)}
							</p>
						</div>
					</div>

					<div class="mt-4">
						<div class="flex items-center justify-between mb-2">
							<span class="block text-sm font-medium text-gray-700">Serial Numbers (Optional)</span>
							<button
								type="button"
								onclick={() => addSerialNumber(index)}
								class="text-sm text-blue-600 hover:text-blue-700 font-medium"
							>
								+ Add Serial Number
							</button>
						</div>
						{#if item.serialNumbers.length === 0}
							<p class="text-xs text-gray-500 italic">No serial numbers added</p>
						{:else}
							<div class="space-y-2">
								{#each item.serialNumbers as serial, serialIndex (serialIndex)}
									<div class="flex gap-2">
										<input
											type="text"
											value={serial}
											oninput={(e) => updateSerialNumber(index, serialIndex, e.currentTarget.value)}
											class="flex-1 px-3.5 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-sm"
											placeholder="Serial number"
										/>
										<button
											type="button"
											onclick={() => removeSerialNumber(index, serialIndex)}
											class="px-3 py-2 text-red-600 hover:text-red-700 text-sm"
										>
											×
										</button>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			{/each}

			<div class="p-4 bg-gray-50 rounded-md border border-gray-200">
				<div class="flex justify-between items-center">
					<span class="text-sm font-medium text-gray-700">Total Equipment Value:</span>
					<span class="text-lg font-bold text-blue-600">{formatCurrency(formState.totalEquipmentValue)}</span>
				</div>
			</div>
		</div>
	{/if}
</div>
