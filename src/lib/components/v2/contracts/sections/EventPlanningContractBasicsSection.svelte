<script lang="ts">
	import type { EventPlanningContractFormState } from '$lib/state/v2/eventPlanningContractFormState.svelte';
	import type { Event } from '$lib/types/v2';
	import type { ClientCounterparty } from '$lib/types/v2';
	import FormSection from '$lib/components/FormSection.svelte';
	import TextField from '$lib/components/TextField.svelte';
	import SelectField from '$lib/components/SelectField.svelte';
	import { Button } from '$lib/components/ui/button';
	import CreateCounterpartyInline from './CreateCounterpartyInline.svelte';
	import CreateEventInline from './CreateEventInline.svelte';
	import { slide } from 'svelte/transition';

	interface Props {
		formState: EventPlanningContractFormState;
		events: Event[];
		clients: ClientCounterparty[];
		onClientChange?: () => void;
		onEventChange?: () => void;
		onCreateCounterparty?: () => Promise<void>;
		onCreateEvent?: () => Promise<void>;
	}

	let {
		formState,
		events,
		clients,
		onClientChange,
		onEventChange,
		onCreateCounterparty,
		onCreateEvent
	}: Props = $props();
</script>

<FormSection title="Contract Basics">
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<TextField
			id="contractNumber"
			label="Contract Number"
			bind:value={formState.contractNumber}
			placeholder="EVT-20260104-1234"
		/>

		<TextField
			id="contractDate"
			label="Contract Date"
			type="date"
			bind:value={formState.contractDate}
			required
		/>

		<TextField
			class="col-span-full"
			id="contractLocation"
			label="Contract Location"
			bind:value={formState.contractLocation}
			required
			placeholder="Ho Chi Minh City"
		/>

		<div class="flex items-end gap-2">
			{#if !formState.showCreateEvent}
				<SelectField
					class="flex-1"
					id="eventId"
					label="Event"
					bind:value={formState.eventId}
					onchange={() => onEventChange?.()}
					required
				>
					<option value="">Select an event</option>
					{#each events as event (event.id)}
						<option value={event.id}>{event.name} - {event.eventDate}</option>
					{/each}
				</SelectField>
			{/if}
			<Button
				variant={formState.showCreateEvent ? 'ghost' : 'dark'}
				size="sm"
				class="mb-1 h-7 text-xs whitespace-nowrap"
				onclick={() => (formState.showCreateEvent = !formState.showCreateEvent)}
			>
				{#if formState.showCreateEvent}
					← Back to list
				{:else}
					+ Create New
				{/if}
			</Button>
		</div>

		<div class="flex items-end gap-2">
			{#if !formState.showCreateCounterparty}
				<SelectField
					class="flex-1"
					id="counterpartyId"
					label="Client"
					bind:value={formState.counterpartyId}
					onchange={() => onClientChange?.()}
					required
				>
					<option value="">Select a client</option>
					{#each clients as client (client.id)}
						<option value={client.id}>{client.name}</option>
					{/each}
				</SelectField>
			{/if}
			<Button
				variant={formState.showCreateCounterparty ? 'ghost' : 'dark'}
				size="sm"
				class="mb-1 h-7 text-xs whitespace-nowrap"
				onclick={() => (formState.showCreateCounterparty = !formState.showCreateCounterparty)}
			>
				{#if formState.showCreateCounterparty}
					← Back to list
				{:else}
					+ Create New
				{/if}
			</Button>
		</div>

		<SelectField
			id="paymentStatus"
			label="Payment Status"
			bind:value={formState.paymentStatus}
			required
		>
			<option value="unpaid">Unpaid</option>
			<option value="paid">Paid</option>
		</SelectField>
	</div>

	{#if formState.showCreateEvent && onCreateEvent}
		<div class="mt-4" transition:slide={{ duration: 250 }}>
			<CreateEventInline
				{formState}
				onCancel={() => (formState.showCreateEvent = false)}
				onCreate={onCreateEvent}
			/>
		</div>
	{/if}

	{#if formState.showCreateCounterparty && onCreateCounterparty}
		<div class="mt-4" transition:slide={{ duration: 250 }}>
			<CreateCounterpartyInline
				{formState}
				onCancel={() => (formState.showCreateCounterparty = false)}
				onCreate={onCreateCounterparty}
			/>
		</div>
	{/if}
</FormSection>
