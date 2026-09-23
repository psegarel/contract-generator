<script lang="ts">
	import type { Counterparty } from '$lib/types/v2';
	import type { Event as CalendarEvent } from '$lib/types/v2/event';
	import type { EquipmentRentalOneOffContractFormState } from '$lib/state/v2/equipmentRentalOneOffContractFormState.svelte';
	import TextField from '$lib/components/TextField.svelte';
	import SelectField from '$lib/components/SelectField.svelte';
	import FormSection from '$lib/components/FormSection.svelte';

	interface Props {
		formState: EquipmentRentalOneOffContractFormState;
		counterparties: Counterparty[];
		events: CalendarEvent[];
		onEventSelect: (eventId: string) => void;
	}

	let { formState, counterparties, events, onEventSelect }: Props = $props();
</script>

<FormSection title="Contract Basics">
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<TextField
			id="contractNumber"
			label="Contract Number"
			bind:value={formState.contractNumber}
			placeholder="EQR-20260713-1234"
		/>

		<SelectField
			id="counterpartyId"
			label="Counterparty"
			bind:value={formState.counterpartyId}
			required
		>
			<option value="">Select a counterparty</option>
			{#each counterparties as counterparty (counterparty.id)}
				<option value={counterparty.id}>{counterparty.name}</option>
			{/each}
		</SelectField>

		<div>
			<SelectField
				id="eventId"
				label="Link to Event (optional)"
				value={formState.eventId || ''}
				onchange={(e) => onEventSelect(e.currentTarget.value)}
			>
				<option value="">No event (standalone)</option>
				{#each events as event (event.id)}
					<option value={event.id}>{event.name}</option>
				{/each}
			</SelectField>
			<p class="text-xs text-muted-foreground mt-1">Auto-fills event name below when selected</p>
		</div>

		<SelectField id="paymentStatus" label="Payment Status" bind:value={formState.paymentStatus}>
			<option value="unpaid">Unpaid</option>
			<option value="paid">Paid</option>
		</SelectField>
	</div>
</FormSection>
