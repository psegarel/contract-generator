<script lang="ts">
	import type { EquipmentRentalContractFormState } from '$lib/state/v2/equipmentRentalContractFormState.svelte';
	import { formatCurrency } from '$lib/utils/formatting';
	import TextField from '$lib/components/TextField.svelte';

	interface Props {
		formState: EquipmentRentalContractFormState;
	}

	let { formState }: Props = $props();
</script>

<div class="bg-white p-6 rounded-lg border border-gray-200">
	<h3 class="text-lg font-semibold text-gray-900 mb-4">Rental Terms</h3>
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<TextField
			class="col-span-full"
			id="monthlyRent"
			label="Monthly Rent (VND)"
			type="number"
			bind:value={formState.monthlyRent}
			min="0"
			step="1000"
			required
			placeholder="10000000"
			helperText={formatCurrency(formState.monthlyRent)}
		/>

		<TextField
			id="securityDeposit"
			label="Security Deposit (VND)"
			type="number"
			bind:value={formState.securityDeposit}
			min="0"
			step="1000"
			required
			placeholder="5000000"
			helperText={formatCurrency(formState.securityDeposit)}
		/>

		<TextField
			id="deliveryFee"
			label="Delivery Fee (VND)"
			type="number"
			bind:value={formState.deliveryFee}
			min="0"
			step="1000"
			required
			placeholder="1000000"
			helperText={formatCurrency(formState.deliveryFee)}
		/>

		<div class="col-span-full">
			<label class="flex items-center gap-2 cursor-pointer">
				<input
					type="checkbox"
					bind:checked={formState.damageWaiver}
					class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
				/>
				<span class="text-sm font-medium text-gray-700">Damage Waiver Included</span>
			</label>
			<p class="text-xs text-gray-500 mt-1 ml-6">
				Check if damage waiver is included in the rental terms
			</p>
		</div>

		<div class="col-span-full p-4 bg-gray-50 rounded-md border border-gray-200">
			<div class="grid gap-2 text-sm">
				<div class="flex justify-between">
					<span class="text-gray-600">Monthly Rent:</span>
					<span class="font-semibold text-gray-900">{formatCurrency(formState.monthlyRent)}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-600">Rental Period:</span>
					<span class="font-semibold text-gray-900">{formState.rentalMonths} month{formState.rentalMonths !== 1 ? 's' : ''}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-600">Equipment Residual Value:</span>
					<span class="font-semibold text-gray-900">{formatCurrency(formState.totalEquipmentValue)}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-600">Delivery Fee:</span>
					<span class="font-semibold text-gray-900">{formatCurrency(formState.deliveryFee)}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-600">Security Deposit:</span>
					<span class="font-semibold text-gray-900">{formatCurrency(formState.securityDeposit)}</span>
				</div>
				<div class="flex justify-between pt-2 border-t border-gray-300">
					<span class="text-gray-700 font-medium">Total Contract Value:</span>
					<span class="font-bold text-blue-600">{formatCurrency(formState.calculatedContractValue)}</span>
				</div>
			</div>
		</div>
	</div>
</div>
