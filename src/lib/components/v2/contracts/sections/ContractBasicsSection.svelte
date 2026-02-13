<script lang="ts">
	import type { ServiceProvisionContractFormState } from '$lib/state/v2/serviceProvisionContractFormState.svelte';
	import type { Event } from '$lib/types/v2';
	import type { ServiceProviderCounterparty } from '$lib/types/v2';
	import TextField from '$lib/components/TextField.svelte';

	interface Props {
		formState: ServiceProvisionContractFormState;
		events: Event[];
		serviceProviders: ServiceProviderCounterparty[];
		onCreateProviderClick: () => void;
		onCounterpartyChange?: () => void;
	}

	let { formState, events, serviceProviders, onCreateProviderClick, onCounterpartyChange }: Props = $props();
</script>

<div class="bg-white p-6 rounded-lg border border-gray-200">
	<h3 class="text-lg font-semibold text-gray-900 mb-4">Contract Basics</h3>
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<TextField
			id="contractNumber"
			label="Contract Number"
			bind:value={formState.contractNumber}
			required
			placeholder="SVC-20260104-1234"
		/>

		<div>
			<label for="status" class="block text-sm font-medium text-gray-700 mb-1">
				Status <span class="text-red-500">*</span>
			</label>
			<select
				id="status"
				bind:value={formState.status}
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
			>
				<option value="draft">Draft</option>
				<option value="generated">Generated</option>
			</select>
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
			<div class="flex items-center justify-between mb-1">
				<label for="counterpartyId" class="block text-sm font-medium text-gray-700">
					Service Provider <span class="text-red-500">*</span>
				</label>
				<button
					type="button"
					onclick={onCreateProviderClick}
					class="text-sm text-blue-600 hover:text-blue-700 font-medium"
				>
					+ Create New
				</button>
			</div>
			<select
				id="counterpartyId"
				bind:value={formState.counterpartyId}
				onchange={() => onCounterpartyChange?.()}
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
			>
				<option value="">Select a service provider</option>
				{#each serviceProviders as provider (provider.id)}
					<option value={provider.id}>{provider.name}</option>
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
