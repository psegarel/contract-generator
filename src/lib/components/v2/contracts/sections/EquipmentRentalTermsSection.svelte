<script lang="ts">
	import type { EquipmentRentalContractFormState } from '$lib/state/v2/equipmentRentalContractFormState.svelte';
	import { formatCurrency } from '$lib/utils/formatting';
	import TextField from '$lib/components/TextField.svelte';
	import FormSection from '$lib/components/FormSection.svelte';

	interface Props {
		formState: EquipmentRentalContractFormState;
	}

	let { formState }: Props = $props();
</script>

<FormSection title="Rental Terms">
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
					class="w-4 h-4 text-primary border-border rounded focus:ring-ring"
				/>
				<span class="text-sm font-medium text-foreground">Damage Waiver Included</span>
			</label>
			<p class="text-xs text-muted-foreground mt-1 ml-6">
				Check if damage waiver is included in the rental terms
			</p>
		</div>

		<div class="col-span-full p-4 bg-muted">
			<div class="grid gap-2 text-sm">
				<div class="flex justify-between">
					<span class="text-muted-foreground">Monthly Rent:</span>
					<span class="font-semibold text-foreground">{formatCurrency(formState.monthlyRent)}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-muted-foreground">Rental Period:</span>
					<span class="font-semibold text-foreground"
						>{formState.rentalMonths} month{formState.rentalMonths !== 1 ? 's' : ''}</span
					>
				</div>
				<div class="flex justify-between">
					<span class="text-muted-foreground">Equipment Residual Value:</span>
					<span class="font-semibold text-foreground"
						>{formatCurrency(formState.totalEquipmentValue)}</span
					>
				</div>
				<div class="flex justify-between">
					<span class="text-muted-foreground">Delivery Fee:</span>
					<span class="font-semibold text-foreground">{formatCurrency(formState.deliveryFee)}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-muted-foreground">Security Deposit:</span>
					<span class="font-semibold text-foreground"
						>{formatCurrency(formState.securityDeposit)}</span
					>
				</div>
				<div class="flex justify-between bg-muted/60 px-2 py-2">
					<span class="text-foreground font-medium">Total Contract Value:</span>
					<span class="font-bold text-primary"
						>{formatCurrency(formState.calculatedContractValue)}</span
					>
				</div>
			</div>
		</div>
	</div>
</FormSection>
