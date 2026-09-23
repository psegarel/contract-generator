<script lang="ts">
	import type { EquipmentRentalOneOffContractFormState } from '$lib/state/v2/equipmentRentalOneOffContractFormState.svelte';
	import TextField from '$lib/components/TextField.svelte';
	import FormSection from '$lib/components/FormSection.svelte';

	interface Props {
		formState: EquipmentRentalOneOffContractFormState;
	}

	let { formState }: Props = $props();
</script>

<FormSection title="Setup & Collection">
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<TextField
			id="setupDateTime"
			label="Setup Deadline (delivery, install & test)"
			type="datetime-local"
			bind:value={formState.setupDateTime}
			required
		/>
		<TextField
			id="collectionDateTime"
			label="Collection Deadline (dismantle & collect)"
			type="datetime-local"
			bind:value={formState.collectionDateTime}
			required
		/>
	</div>
</FormSection>
