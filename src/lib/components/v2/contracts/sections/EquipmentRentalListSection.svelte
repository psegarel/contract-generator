<script lang="ts">
	import type { EquipmentRentalContractFormState } from '$lib/state/v2/equipmentRentalContractFormState.svelte';
	import type { EquipmentItem } from '$lib/types/v2';
	import { formatCurrency } from '$lib/utils/formatting';
	import FormSection from '$lib/components/FormSection.svelte';
	import TextField from '$lib/components/TextField.svelte';
	import { Button } from '$lib/components/ui/button';

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

<FormSection title="Equipment List">
	<div class="flex justify-end mb-6">
		<Button type="button" size="sm" onclick={() => formState.addEquipmentItem()}>
			+ Add Equipment
		</Button>
	</div>

	{#if formState.equipment.length === 0}
		<p class="text-sm text-muted-foreground italic">
			No equipment items added yet. Click "Add Equipment" to get started.
		</p>
	{:else}
		<div class="space-y-4">
			{#each formState.equipment as item, index (index)}
				<div class="p-4 bg-muted/30">
					<div class="flex items-center justify-between mb-3">
						<h4 class="text-sm font-semibold text-foreground">Equipment Item #{index + 1}</h4>
						<Button
							variant="destructive"
							size="sm"
							class="h-auto p-0"
							type="button"
							onclick={() => formState.removeEquipmentItem(index)}
						>
							Remove
						</Button>
					</div>

					<div class="grid gap-4 grid-cols-1 md:grid-cols-3">
						<TextField
							id="equipment-name-{index}"
							label="Equipment Name"
							value={item.name}
							oninput={(e) => updateItem(index, 'name', e.currentTarget.value)}
							required
							placeholder="e.g., Audio Mixer"
						/>

						<TextField
							id="equipment-quantity-{index}"
							type="number"
							label="Quantity"
							value={item.quantity}
							oninput={(e) => updateItem(index, 'quantity', Number(e.currentTarget.value))}
							min="1"
							required
						/>

						<div>
							<TextField
								id="equipment-unitPrice-{index}"
								type="number"
								label="Unit Price (VND)"
								value={item.unitPrice}
								oninput={(e) => updateItem(index, 'unitPrice', Number(e.currentTarget.value))}
								min="0"
								step="1000"
								required
								placeholder="1000000"
							/>
							<p class="text-xs text-muted-foreground mt-1">
								Total: {formatCurrency(item.quantity * item.unitPrice)}
							</p>
						</div>
					</div>

					<div class="mt-4">
						<div class="flex items-center justify-between mb-2">
							<span class="block text-sm font-medium text-foreground"
								>Serial Numbers (Optional)</span
							>
							<Button
								variant="link"
								size="sm"
								class="h-auto p-0 text-sm"
								type="button"
								onclick={() => addSerialNumber(index)}
							>
								+ Add Serial Number
							</Button>
						</div>
						{#if item.serialNumbers.length === 0}
							<p class="text-xs text-muted-foreground italic">No serial numbers added</p>
						{:else}
							<div class="space-y-2">
								{#each item.serialNumbers as serial, serialIndex (serialIndex)}
									<div class="flex gap-2">
										<TextField
											class="flex-1"
											label="Serial number"
											labelHidden
											id="equipment-serial-{index}-{serialIndex}"
											type="text"
											value={serial}
											oninput={(e) => updateSerialNumber(index, serialIndex, e.currentTarget.value)}
											placeholder="Serial number"
										/>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											class="h-auto px-2 py-1 text-destructive hover:text-destructive/80"
											onclick={() => removeSerialNumber(index, serialIndex)}
										>
											&times;
										</Button>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			{/each}

			<div class="p-4 bg-muted">
				<div class="flex justify-between items-center">
					<span class="text-sm font-medium text-foreground">Total Equipment Value:</span>
					<span class="text-lg font-bold text-primary"
						>{formatCurrency(formState.totalEquipmentValue)}</span
					>
				</div>
			</div>
		</div>
	{/if}
</FormSection>
