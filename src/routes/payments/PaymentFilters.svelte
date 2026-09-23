<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import SelectField from '$lib/components/SelectField.svelte';
	import type { PaymentDirectionFilter, PaymentStatusFilter } from '$lib/forms/payments';

	interface Props {
		status: PaymentStatusFilter;
		direction: PaymentDirectionFilter;
		contractType: string;
		contractId: string | null;
		onClearContractFilter: () => void;
	}

	let {
		status = $bindable('all'),
		direction = $bindable('all'),
		contractType = $bindable('all'),
		contractId,
		onClearContractFilter
	}: Props = $props();
</script>

<div class="mb-6 flex flex-wrap gap-3">
	{#if contractId}
		<Button variant="outline" size="sm" onclick={onClearContractFilter}>
			Filtered by contract &times;
		</Button>
	{/if}

	<SelectField
		id="payment-status-filter"
		label="Status"
		labelHidden
		bind:value={status}
		class="w-auto"
	>
		<option value="all">All statuses</option>
		<option value="pending">Pending</option>
		<option value="paid">Paid</option>
	</SelectField>

	<SelectField
		id="payment-direction-filter"
		label="Direction"
		labelHidden
		bind:value={direction}
		class="w-auto"
	>
		<option value="all">All directions</option>
		<option value="receivable">Receivable</option>
		<option value="payable">Payable</option>
	</SelectField>

	<SelectField
		id="payment-contract-type-filter"
		label="Contract type"
		labelHidden
		bind:value={contractType}
		class="w-auto"
	>
		<option value="all">All types</option>
		<option value="venue-rental">Venue</option>
		<option value="performer-booking">Performer</option>
		<option value="equipment-rental">Equipment</option>
		<option value="equipment-rental-oneoff">Equipment (One-Off)</option>
		<option value="service-provision">Service</option>
		<option value="event-planning">Event Planning</option>
		<option value="subcontractor">Subcontractor</option>
		<option value="client-service">Client Service</option>
		<option value="dj-residency">DJ Residency</option>
	</SelectField>
</div>
