<script lang="ts">
	import type { ServiceProvisionContract } from '$lib/types/v2';
	import {
		serviceProvisionContractInputSchema,
		type ServiceProvisionContractInput
	} from '$lib/schemas/v2/contracts/serviceProvision';
	import { saveServiceProvisionContract, updateServiceProvisionContract } from '$lib/utils/v2';
	import { authState } from '$lib/state/auth.svelte';
	import { eventState, counterpartyState } from '$lib/state/v2';
	import ServiceDetailsSection from './sections/ServiceDetailsSection.svelte';
	import FinancialSection from './sections/FinancialSection.svelte';
	import BankingSection from './sections/BankingSection.svelte';
	import ClientInfoSection from './sections/ClientInfoSection.svelte';

	interface Props {
		contract?: ServiceProvisionContract | null;
		onSuccess?: (contractId: string) => void;
		onCancel?: () => void;
	}

	let { contract = null, onSuccess, onCancel }: Props = $props();

	// Initialize state
	$effect(() => {
		eventState.init();
		counterpartyState.init();
		return () => {
			eventState.destroy();
			counterpartyState.destroy();
		};
	});

	// Get available events and clients for selection
	const events = $derived(eventState.events);
	const clients = $derived(counterpartyState.counterparties.filter((c) => c.type === 'client'));

	// Form state - initialize empty, sync with contract prop via $effect
	let contractNumber = $state('');
	let eventId = $state<string>('');
	let counterpartyId = $state<string>('');
	let jobName = $state('');
	let jobContent = $state('');
	let numberOfPerformances = $state(1);
	let firstPerformanceTime = $state('');
	let startDate = $state('');
	let endDate = $state('');
	let taxRate = $state(10);
	let netFee = $state(0);
	let status = $state<'draft' | 'generated'>('draft');
	let bankName = $state('');
	let accountNumber = $state('');
	let clientEmail = $state('');
	let clientAddress = $state('');
	let clientPhone = $state('');
	let clientIdDocument = $state('');
	let clientTaxId = $state('');
	let eventLocation = $state('');
	let paymentStatus = $state<'unpaid' | 'paid'>('unpaid');
	let notes = $state('');

	// Sync form state with contract prop (only on initial load or contract change)
	$effect(() => {
		if (contract) {
			contractNumber = contract.contractNumber;
			eventId = contract.eventId || '';
			counterpartyId = contract.counterpartyId;
			jobName = contract.jobName;
			jobContent = contract.jobContent;
			numberOfPerformances = contract.numberOfPerformances;
			firstPerformanceTime = contract.firstPerformanceTime;
			startDate = contract.startDate;
			endDate = contract.endDate;
			taxRate = contract.taxRate;
			netFee = contract.netFee;
			status = contract.status;
			bankName = contract.bankName;
			accountNumber = contract.accountNumber;
			clientEmail = contract.clientEmail;
			clientAddress = contract.clientAddress;
			clientPhone = contract.clientPhone;
			clientIdDocument = contract.clientIdDocument;
			clientTaxId = contract.clientTaxId || '';
			eventLocation = contract.eventLocation;
			paymentStatus = contract.paymentStatus;
			notes = contract.notes || '';
		}
	});

	// Auto-fill client details when client is selected
	$effect(() => {
		if (counterpartyId && clients.length > 0) {
			const selectedClient = clients.find((c) => c.id === counterpartyId);
			if (selectedClient && selectedClient.type === 'client') {
				clientEmail = selectedClient.email || '';
				clientAddress = selectedClient.address || '';
				clientPhone = selectedClient.phone || '';
				clientIdDocument = selectedClient.idDocument || '';
				clientTaxId = selectedClient.taxId || '';
				bankName = selectedClient.bankName || '';
				accountNumber = selectedClient.bankAccountNumber || '';
			}
		}
	});

	// Auto-generate contract number when creating new
	$effect(() => {
		if (!contract && !contractNumber) {
			const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
			const timestamp = Date.now().toString().slice(-4);
			contractNumber = `SVC-${dateStr}-${timestamp}`;
		}
	});

	// Calculate contract value (gross amount before tax)
	let contractValue = $derived(Math.round(netFee / (1 - taxRate / 100)));

	// Get selected event and counterparty names
	let eventName = $derived(events.find((e) => e.id === eventId)?.name || '');
	let counterpartyName = $derived(clients.find((c) => c.id === counterpartyId)?.name || '');

	let isSubmitting = $state(false);
	let error = $state<string | null>(null);

	async function handleSubmit() {
		if (!authState.user) {
			error = 'You must be logged in to create a contract';
			return;
		}

		if (!eventId) {
			error = 'Please select an event';
			return;
		}

		if (!counterpartyId) {
			error = 'Please select a client';
			return;
		}

		isSubmitting = true;
		error = null;

		try {
			const contractData: ServiceProvisionContractInput = {
				type: 'service-provision',
				ownerUid: authState.user.uid,
				contractNumber,
				eventId,
				counterpartyId,
				counterpartyName,
				eventName,
				paymentDirection: 'receivable',
				paymentStatus,
				contractValue,
				currency: 'VND',
				notes: notes || null,
				jobName,
				jobContent,
				numberOfPerformances,
				firstPerformanceTime,
				startDate,
				endDate,
				taxRate,
				netFee,
				status,
				bankName,
				accountNumber,
				clientEmail,
				clientAddress,
				clientPhone,
				clientIdDocument,
				clientTaxId: clientTaxId || null,
				eventLocation
			};

			// Validate with schema
			const validationResult = serviceProvisionContractInputSchema.safeParse(contractData);
			if (!validationResult.success) {
				error = 'Validation error: ' + validationResult.error.issues[0].message;
				return;
			}

			let contractId: string;
			if (contract) {
				await updateServiceProvisionContract(contract.id, contractData);
				contractId = contract.id;
			} else {
				contractId = await saveServiceProvisionContract(contractData);
			}

			if (onSuccess) {
				onSuccess(contractId);
			}
		} catch (e) {
			console.error('Error saving contract:', e);
			error = (e as Error).message;
		} finally {
			isSubmitting = false;
		}
	}
</script>

<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-6">
	<!-- Error message -->
	{#if error}
		<div class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
			{error}
		</div>
	{/if}

	<!-- Contract Basics -->
	<div class="bg-white p-6 rounded-lg border border-gray-200">
		<h3 class="text-lg font-semibold text-gray-900 mb-4">Contract Basics</h3>
		<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
			<div>
				<label for="contractNumber" class="block text-sm font-medium text-gray-700 mb-1">
					Contract Number <span class="text-red-500">*</span>
				</label>
				<input
					id="contractNumber"
					type="text"
					bind:value={contractNumber}
					required
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
					placeholder="SVC-20260104-1234"
				/>
			</div>

			<div>
				<label for="status" class="block text-sm font-medium text-gray-700 mb-1">
					Status <span class="text-red-500">*</span>
				</label>
				<select
					id="status"
					bind:value={status}
					required
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
					bind:value={eventId}
					required
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				>
					<option value="">Select an event</option>
					{#each events as event}
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
					bind:value={counterpartyId}
					required
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				>
					<option value="">Select a client</option>
					{#each clients as client}
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
					bind:value={paymentStatus}
					required
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				>
					<option value="unpaid">Unpaid</option>
					<option value="paid">Paid</option>
				</select>
			</div>
		</div>
	</div>

	<!-- Service Details Section -->
	<ServiceDetailsSection
		{jobName}
		{jobContent}
		{numberOfPerformances}
		{firstPerformanceTime}
		{startDate}
		{endDate}
		{eventLocation}
		onjobNameChange={(value) => (jobName = value)}
		onjobContentChange={(value) => (jobContent = value)}
		onnumberOfPerformancesChange={(value) => (numberOfPerformances = value)}
		onfirstPerformanceTimeChange={(value) => (firstPerformanceTime = value)}
		onstartDateChange={(value) => (startDate = value)}
		onendDateChange={(value) => (endDate = value)}
		oneventLocationChange={(value) => (eventLocation = value)}
	/>

	<!-- Financial Section -->
	<FinancialSection
		{netFee}
		{taxRate}
		onnetFeeChange={(value) => (netFee = value)}
		ontaxRateChange={(value) => (taxRate = value)}
	/>

	<!-- Banking Section -->
	<BankingSection
		{bankName}
		{accountNumber}
		onbankNameChange={(value) => (bankName = value)}
		onaccountNumberChange={(value) => (accountNumber = value)}
	/>

	<!-- Client Info Section -->
	<ClientInfoSection
		{clientEmail}
		{clientAddress}
		{clientPhone}
		{clientIdDocument}
		{clientTaxId}
		onclientEmailChange={(value) => (clientEmail = value)}
		onclientAddressChange={(value) => (clientAddress = value)}
		onclientPhoneChange={(value) => (clientPhone = value)}
		onclientIdDocumentChange={(value) => (clientIdDocument = value)}
		onclientTaxIdChange={(value) => (clientTaxId = value)}
	/>

	<!-- Notes -->
	<div class="bg-white p-6 rounded-lg border border-gray-200">
		<h3 class="text-lg font-semibold text-gray-900 mb-4">Internal Notes</h3>
		<textarea
			id="notes"
			bind:value={notes}
			rows="4"
			class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
			placeholder="Internal notes..."
		></textarea>
	</div>

	<!-- Form Actions -->
	<div class="flex gap-3 justify-end">
		{#if onCancel}
			<button
				type="button"
				onclick={onCancel}
				disabled={isSubmitting}
				class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
			>
				Cancel
			</button>
		{/if}
		<button
			type="submit"
			disabled={isSubmitting}
			class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
		>
			{isSubmitting ? 'Saving...' : contract ? 'Update Contract' : 'Create Contract'}
		</button>
	</div>
</form>
