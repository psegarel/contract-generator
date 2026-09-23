<script lang="ts">
	import type { EquipmentRentalOneOffContractFormState } from '$lib/state/v2/equipmentRentalOneOffContractFormState.svelte';
	import TextField from '$lib/components/TextField.svelte';
	import FormSection from '$lib/components/FormSection.svelte';

	interface Props {
		formState: EquipmentRentalOneOffContractFormState;
	}

	let { formState }: Props = $props();
</script>

<FormSection title="Venue / Delivery Location">
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<TextField
			id="venueName"
			label="Venue Name (Vietnamese)"
			bind:value={formState.venueName}
			required
		/>
		<TextField
			id="venueNameEnglish"
			label="Venue Name (English)"
			bind:value={formState.venueNameEnglish}
			required
		/>
		<TextField
			id="venueAddress"
			label="Address (Vietnamese)"
			bind:value={formState.venueAddress}
			required
		/>
		<TextField
			id="venueAddressEnglish"
			label="Address (English)"
			bind:value={formState.venueAddressEnglish}
			required
		/>
	</div>
</FormSection>
