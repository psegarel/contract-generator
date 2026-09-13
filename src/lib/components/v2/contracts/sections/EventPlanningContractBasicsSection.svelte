<script lang="ts">
	import type { EventPlanningContractFormState } from '$lib/state/v2/eventPlanningContractFormState.svelte';
	import type { Event } from '$lib/types/v2';
	import type { ClientCounterparty } from '$lib/types/v2';
	import TextField from '$lib/components/TextField.svelte';
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

<div class="bg-white p-6 rounded-lg border border-gray-200">
	<h3 class="text-lg font-semibold text-gray-900 mb-4">Contract Basics</h3>
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
				<label for="eventId" class="block text-sm font-medium text-gray-700">
					Event <span class="text-red-500">*</span>
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
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
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
				<label for="counterpartyId" class="block text-sm font-medium text-gray-700">
					Client <span class="text-red-500">*</span>
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
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				>
					<option value="">Select a client</option>
					{#each clients as client (client.id)}
						<option value={client.id}>{client.name}</option>
					{/each}
				</select>
			{/if}
		</div>

		<div>
			<label for="paymentStatus" class="block text-sm font-medium text-gray-700 mb-1">
				Payment Status <span class="text-red-500">*</span>
			</label>
			<select
				id="paymentStatus"
				bind:value={formState.paymentStatus}
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
			>
				<option value="unpaid">Unpaid</option>
				<option value="paid">Paid</option>
			</select>
		</div>
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
</div>
