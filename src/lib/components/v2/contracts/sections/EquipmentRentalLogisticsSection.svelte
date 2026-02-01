<script lang="ts">
	import type { EquipmentRentalContractFormState } from '$lib/state/v2/equipmentRentalContractFormState.svelte';
	import TextField from '$lib/components/TextField.svelte';

	interface Props {
		formState: EquipmentRentalContractFormState;
	}

	let { formState }: Props = $props();
</script>

<div class="bg-white p-6 rounded-lg border border-gray-200">
	<h3 class="text-lg font-semibold text-gray-900 mb-4">Venue Information</h3>
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<div>
			<TextField
				id="venueName"
				label="Venue Name (Vietnamese)"
				bind:value={formState.venueName}
				placeholder="e.g., Nhà hàng Ngon Thi Hoa"
				required
			/>
		</div>
		<div>
			<TextField
				id="venueNameEnglish"
				label="Venue Name (English)"
				bind:value={formState.venueNameEnglish}
				placeholder="e.g., Ngon Thi Hoa Restaurant"
				required
			/>
		</div>
		<div>
			<TextField
				id="venueAddress"
				label="Venue Address (Vietnamese)"
				bind:value={formState.venueAddress}
				placeholder="e.g., 100 Lê Quang Đạo, Ngũ Hành Sơn, Đà Nẵng 550000"
				required
			/>
		</div>
		<div>
			<TextField
				id="venueAddressEnglish"
				label="Venue Address (English)"
				bind:value={formState.venueAddressEnglish}
				placeholder="e.g., 100 Le Quang Dao, Ngu Hanh Son, Da Nang 550000"
				required
			/>
			<p class="mt-1 text-sm text-gray-500">
				Address where the equipment will be located and used
			</p>
		</div>
	</div>
</div>
