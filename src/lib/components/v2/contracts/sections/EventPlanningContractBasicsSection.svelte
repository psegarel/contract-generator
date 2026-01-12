<script lang="ts">
	import type { EventPlanningContractFormState } from '$lib/state/v2/eventPlanningContractFormState.svelte';
	import type { Event } from '$lib/types/v2';
	import type { ClientCounterparty } from '$lib/types/v2';
	import TextField from '$lib/components/TextField.svelte';

	interface Props {
		formState: EventPlanningContractFormState;
		events: Event[];
		clients: ClientCounterparty[];
		onClientChange?: () => void;
	}

	let { formState, events, clients, onClientChange }: Props = $props();
</script>

<div class="bg-white p-6 rounded-lg border border-gray-200">
	<h3 class="text-lg font-semibold text-gray-900 mb-4">Contract Basics</h3>
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<div>
			<TextField
				id="contractNumber"
				label="Contract Number"
				bind:value={formState.contractNumber}
				placeholder="EVT-20260104-1234"
			/>
		</div>

		<div>
			<label for="contractDate" class="block text-sm font-medium text-gray-700 mb-1">
				Contract Date <span class="text-red-500">*</span>
			</label>
			<input
				id="contractDate"
				type="date"
				bind:value={formState.contractDate}
				required
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
			/>
		</div>

		<div class="col-span-full">
			<TextField
				id="contractLocation"
				label="Contract Location"
				bind:value={formState.contractLocation}
				required
				placeholder="Ho Chi Minh City"
			/>
		</div>

		<div>
			<label for="eventId" class="block text-sm font-medium text-gray-700 mb-1">
				Event <span class="text-red-500">*</span>
			</label>
			<select
				id="eventId"
				bind:value={formState.eventId}
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
			>
				<option value="">Select an event</option>
				{#each events as event (event.id)}
					<option value={event.id}>{event.name} - {event.eventDate}</option>
				{/each}
			</select>
		</div>

		<div>
			<label for="counterpartyId" class="block text-sm font-medium text-gray-700 mb-1">
				Client <span class="text-red-500">*</span>
			</label>
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
</div>
