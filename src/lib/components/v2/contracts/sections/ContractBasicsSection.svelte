<script lang="ts">
	import type { ServiceProvisionContractFormState } from '$lib/state/v2/serviceProvisionContractFormState.svelte';
	import type { Event, ContractorCounterparty } from '$lib/types/v2';
	import TextField from '$lib/components/TextField.svelte';
	import SelectField from '$lib/components/SelectField.svelte';
	import FormSection from '$lib/components/FormSection.svelte';
	import { Button } from '$lib/components/ui/button';

	interface Props {
		formState: ServiceProvisionContractFormState;
		events: Event[];
		serviceProviders: ContractorCounterparty[];
		onCreateProviderClick: () => void;
		onCounterpartyChange?: () => void;
	}

	let { formState, events, serviceProviders, onCreateProviderClick, onCounterpartyChange }: Props = $props();
</script>

<FormSection title="Contract Basics">
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<TextField
			id="contractNumber"
			label="Contract Number"
			bind:value={formState.contractNumber}
			required
			placeholder="SVC-20260104-1234"
		/>

		<SelectField id="status" label="Status" bind:value={formState.status} required>
			<option value="draft">Draft</option>
			<option value="generated">Generated</option>
		</SelectField>

		<SelectField id="eventId" label="Event" bind:value={formState.eventId} required>
			<option value="">Select an event</option>
			<option value="__standalone__">No specific event (recurring)</option>
			{#each events as event (event.id)}
				<option value={event.id}>{event.name} - {event.eventDate}</option>
			{/each}
		</SelectField>

		<div>
			<div class="flex items-center justify-between mb-1">
				<label for="counterpartyId" class="block text-sm font-medium text-foreground">
					Service Provider <span class="text-destructive">*</span>
				</label>
				<Button
					variant="link"
					size="sm"
					type="button"
					onclick={onCreateProviderClick}
					class="h-auto p-0 text-sm"
				>
					+ Create New
				</Button>
			</div>
			<select
				id="counterpartyId"
				bind:value={formState.counterpartyId}
				onchange={() => onCounterpartyChange?.()}
				class="w-full px-3.5 py-2.5 border border-input rounded-md bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring transition-all text-sm"
			>
				<option value="">Select a service provider</option>
				{#each serviceProviders as provider (provider.id)}
					<option value={provider.id}>{provider.name}</option>
				{/each}
			</select>
		</div>

		<SelectField id="paymentStatus" label="Payment Status" bind:value={formState.paymentStatus} required>
			<option value="unpaid">Unpaid</option>
			<option value="paid">Paid</option>
		</SelectField>
	</div>
</FormSection>
