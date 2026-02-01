<script lang="ts">
	import type { EquipmentRentalContractFormState } from '$lib/state/v2/equipmentRentalContractFormState.svelte';
	import TextField from '$lib/components/TextField.svelte';
	import TextareaField from '$lib/components/TextareaField.svelte';

	interface Props {
		formState: EquipmentRentalContractFormState;
		onCancel: () => void;
		onCreate: () => Promise<void>;
	}

	let { formState, onCancel, onCreate }: Props = $props();
</script>

<div class="bg-blue-50 border border-blue-200 p-6 rounded-lg space-y-6">
	<h3 class="text-lg font-semibold text-gray-900 mb-4">Create New Client</h3>

	<!-- Basic Information -->
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<div class="col-span-full">
			<TextField
				id="newCounterpartyName"
				label="Client Name"
				bind:value={formState.newCounterpartyName}
				placeholder="e.g., CÔNG TY TNHH C VƯỜN NHIỆT ĐỚI"
				required
			/>
		</div>

		<div class="col-span-full">
			<TextField
				id="newCounterpartyCompanyName"
				label="Company Name (Vietnamese)"
				bind:value={formState.newCounterpartyCompanyName}
				placeholder="e.g., CÔNG TY TNHH C VƯỜN NHIỆT ĐỚI"
			/>
		</div>

		<div>
			<TextField
				id="newCounterpartyEmail"
				label="Email"
				type="email"
				bind:value={formState.newCounterpartyEmail}
				placeholder="info@example.com"
			/>
		</div>

		<div>
			<TextField
				id="newCounterpartyPhone"
				label="Phone"
				type="tel"
				bind:value={formState.newCounterpartyPhone}
				placeholder="+84 (0) 236 6515 100"
			/>
		</div>

		<div class="col-span-full">
			<TextareaField
				id="newCounterpartyAddress"
				label="Address"
				bind:value={formState.newCounterpartyAddress}
				rows={2}
				placeholder="100 Lê Quang Đạo, Phường Mỹ An, Quận Ngũ Hành Sơn, Thành phố Đà Nẵng"
			/>
		</div>
	</div>

	<!-- Company Details -->
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<div>
			<TextField
				id="newCounterpartyTaxId"
				label="Tax Code (Mã số thuế)"
				bind:value={formState.newCounterpartyTaxId}
				placeholder="0402151792"
			/>
		</div>

		<div>
			<TextField
				id="newCounterpartyRepresentativeName"
				label="Representative Name (Đại diện bởi)"
				bind:value={formState.newCounterpartyRepresentativeName}
				placeholder="Doan Minh Chau"
			/>
		</div>

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
		<div>
			<TextField
				id="newCounterpartyBankName"
				label="Bank Name (Tên ngân hàng)"
				bind:value={formState.newCounterpartyBankName}
				placeholder="Thương Mại Cổ Phần Á Châu (ACB) - CN Danang"
			/>
		</div>

		<div>
			<TextField
				id="newCounterpartyBankAccountNumber"
				label="Account Number (Số tài khoản)"
				bind:value={formState.newCounterpartyBankAccountNumber}
				placeholder="140 77 168"
			/>
		</div>
	</div>

	<div class="flex gap-3 justify-end pt-4 border-t border-blue-300">
		<button
			type="button"
			onclick={onCancel}
			class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
		>
			Cancel
		</button>
		<button
			type="button"
			onclick={onCreate}
			disabled={formState.isCreatingCounterparty}
			class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
		>
			{formState.isCreatingCounterparty ? 'Creating...' : 'Create Client'}
		</button>
	</div>
</div>
