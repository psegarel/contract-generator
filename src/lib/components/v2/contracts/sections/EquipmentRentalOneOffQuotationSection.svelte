<script lang="ts">
	import type { EquipmentRentalOneOffContractFormState } from '$lib/state/v2/equipmentRentalOneOffContractFormState.svelte';
	import TextField from '$lib/components/TextField.svelte';
	import FormSection from '$lib/components/FormSection.svelte';

	interface Props {
		formState: EquipmentRentalOneOffContractFormState;
	}

	let { formState }: Props = $props();
</script>

<FormSection title="Quotation & Event">
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<TextField
			id="quotationReference"
			label="Quotation Reference"
			bind:value={formState.quotationReference}
			required
			placeholder="e.g., QT-2026-001"
			helperText="Reference number from the external quotation (PDF/Excel)"
		/>
		<TextField
			id="eventName"
			label="Event Name"
			bind:value={formState.eventName}
			required
			placeholder="e.g., Corporate Gala Dinner"
		/>
		<TextField
			id="eventDate"
			label="Event Date"
			type="date"
			bind:value={formState.eventDate}
			required
		/>
	</div>
</FormSection>
