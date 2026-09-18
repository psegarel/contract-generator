<script lang="ts">
	import TextField from '$lib/components/TextField.svelte';
	import TextareaField from '$lib/components/TextareaField.svelte';
	import { Button } from '$lib/components/ui/button';

	/**
	 * Shared interface for form states that support inline counterparty creation.
	 * Both EquipmentRentalContractFormState and DjResidencyContractFormState
	 * implement these fields with identical names.
	 */
	interface InlineCounterpartyFormState {
		newCounterpartyName: string;
		newCounterpartyEmail: string;
		newCounterpartyPhone: string;
		newCounterpartyAddress: string;
		newCounterpartyCompanyName: string;
		newCounterpartyTaxId: string;
		newCounterpartyRepresentativeName: string;
		newCounterpartyRepresentativePosition: string;
		newCounterpartyBankName: string;
		newCounterpartyBankAccountNumber: string;
		isCreatingCounterparty: boolean;
	}

	interface Props {
		formState: InlineCounterpartyFormState;
		onCancel: () => void;
		onCreate: () => Promise<void>;
		title?: string;
		createButtonLabel?: string;
	}

	let {
		formState,
		onCancel,
		onCreate,
		title = 'Create New Client',
		createButtonLabel = 'Create Client'
	}: Props = $props();
</script>

<div class="bg-primary/5 border border-primary/20 p-6 rounded-lg space-y-6">
	<h3 class="text-lg font-semibold text-foreground mb-4">{title}</h3>

	<!-- Basic Information -->
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<div class="col-span-full">
			<TextField
				id="newCounterpartyName"
				label="Name"
				bind:value={formState.newCounterpartyName}
				placeholder="e.g., CONG TY TNHH C VUON NHIET DOI"
				required
			/>
		</div>

		<div class="col-span-full">
			<TextField
				id="newCounterpartyCompanyName"
				label="Company Name (Vietnamese)"
				bind:value={formState.newCounterpartyCompanyName}
				placeholder="e.g., CONG TY TNHH C VUON NHIET DOI"
			/>
		</div>

		<TextField
			id="newCounterpartyEmail"
			label="Email"
			type="email"
			bind:value={formState.newCounterpartyEmail}
			placeholder="info@example.com"
		/>

		<TextField
			id="newCounterpartyPhone"
			label="Phone"
			type="tel"
			bind:value={formState.newCounterpartyPhone}
			placeholder="+84 (0) 236 6515 100"
		/>

		<div class="col-span-full">
			<TextareaField
				id="newCounterpartyAddress"
				label="Address"
				bind:value={formState.newCounterpartyAddress}
				rows={2}
				placeholder="100 Le Quang Dao, Phuong My An, Quan Ngu Hanh Son, Thanh pho Da Nang"
			/>
		</div>
	</div>

	<!-- Company Details -->
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<TextField
			id="newCounterpartyTaxId"
			label="Tax Code (Ma so thue)"
			bind:value={formState.newCounterpartyTaxId}
			placeholder="0402151792"
		/>

		<TextField
			id="newCounterpartyRepresentativeName"
			label="Representative Name (Dai dien boi)"
			bind:value={formState.newCounterpartyRepresentativeName}
			placeholder="Doan Minh Chau"
		/>

		<div class="col-span-full">
			<TextField
				id="newCounterpartyRepresentativePosition"
				label="Representative Position"
				bind:value={formState.newCounterpartyRepresentativePosition}
				placeholder="CEO, Director, etc."
			/>
		</div>
	</div>

	<!-- Banking Information -->
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<TextField
			id="newCounterpartyBankName"
			label="Bank Name (Ten ngan hang)"
			bind:value={formState.newCounterpartyBankName}
			placeholder="Thuong Mai Co Phan A Chau (ACB) - CN Danang"
		/>

		<TextField
			id="newCounterpartyBankAccountNumber"
			label="Account Number (So tai khoan)"
			bind:value={formState.newCounterpartyBankAccountNumber}
			placeholder="140 77 168"
		/>
	</div>

	<div class="flex gap-3 justify-end pt-4 border-t border-primary/30">
		<Button type="button" variant="outline" onclick={onCancel}>
			Cancel
		</Button>
		<Button
			type="button"
			onclick={onCreate}
			disabled={formState.isCreatingCounterparty}
		>
			{formState.isCreatingCounterparty ? 'Creating...' : createButtonLabel}
		</Button>
	</div>
</div>
