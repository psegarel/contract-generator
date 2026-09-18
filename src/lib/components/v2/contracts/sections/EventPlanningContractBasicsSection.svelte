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

		<div>
			<div class="flex items-center justify-between mb-2">
				<label for="eventId" class="block text-sm font-medium text-foreground">
					Event <span class="text-destructive">*</span>
				</label>
				<Button
					variant={formState.showCreateEvent ? 'ghost' : 'dark'}
					size="sm"
					class="h-7 text-xs"
					onclick={() => (formState.showCreateEvent = !formState.showCreateEvent)}
				>
					{#if formState.showCreateEvent}
						← Back to list
					{:else}
						+ Create New
					{/if}
				</Button>
			</div>
			{#if !formState.showCreateEvent}
				<select
					id="eventId"
					bind:value={formState.eventId}
					onchange={() => onEventChange?.()}
					class="w-full px-3.5 py-2.5 border border-input rounded-md focus:ring-2 focus:ring-ring focus:border-ring"
				>
					<option value="">Select an event</option>
					{#each events as event (event.id)}
						<option value={event.id}>{event.name} - {event.eventDate}</option>
					{/each}
				</select>
			{/if}
		</div>

		<div>
			<div class="flex items-center justify-between mb-2">
				<label for="counterpartyId" class="block text-sm font-medium text-foreground">
					Client <span class="text-destructive">*</span>
				</label>
				<Button
					variant={formState.showCreateCounterparty ? 'ghost' : 'dark'}
					size="sm"
					class="h-7 text-xs"
					onclick={() =>
						(formState.showCreateCounterparty = !formState.showCreateCounterparty)}
				>
					{#if formState.showCreateCounterparty}
						← Back to list
					{:else}
						+ Create New
					{/if}
				</Button>
			</div>
			{#if !formState.showCreateCounterparty}
				<select
					id="counterpartyId"
					bind:value={formState.counterpartyId}
					onchange={() => onClientChange?.()}
					class="w-full px-3.5 py-2.5 border border-input rounded-md focus:ring-2 focus:ring-ring focus:border-ring"
				>
					<option value="">Select a client</option>
					{#each clients as client (client.id)}
						<option value={client.id}>{client.name}</option>
					{/each}
				</select>
			{/if}
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
