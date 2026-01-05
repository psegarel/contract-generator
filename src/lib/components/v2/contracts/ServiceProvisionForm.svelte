<script lang="ts">
	import type { ServiceProvisionContract } from '$lib/types/v2';
	import {
		serviceProvisionContractInputSchema,
		type ServiceProvisionContractInput
	} from '$lib/schemas/v2/contracts/serviceProvision';
	import { saveServiceProvisionContract, updateServiceProvisionContract } from '$lib/utils/v2';
	import { saveCounterparty } from '$lib/utils/v2/counterparties';
	import { authState } from '$lib/state/auth.svelte';
	import { eventState, counterpartyState } from '$lib/state/v2';
	import { toast } from 'svelte-sonner';
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

	// Get available events and service providers for selection
	const events = $derived(eventState.events);
	const serviceProviders = $derived(counterpartyState.counterparties.filter((c) => c.type === 'service-provider'));

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
	let contractValue = $state(0); // Base amount (before tax) - same as Event Planning
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
			// Use contractValue from BaseContract, fallback to netFee for backward compatibility
			contractValue = contract.contractValue ?? contract.netFee ?? 0;
			status = contract.status;
			// Ensure bank fields are strings (not null/undefined) for proper input display
			bankName = contract.bankName ?? '';
			accountNumber = contract.accountNumber ?? '';
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

	// Auto-fill service provider details when selected (only for new contracts, not when editing)
	$effect(() => {
		// Don't auto-fill if we're editing an existing contract - preserve contract data
		if (contract) return;
		
		if (counterpartyId && serviceProviders.length > 0) {
			const selectedProvider = serviceProviders.find((c) => c.id === counterpartyId);
			if (selectedProvider && selectedProvider.type === 'service-provider') {
				clientEmail = selectedProvider.email || '';
				clientAddress = selectedProvider.address || '';
				clientPhone = selectedProvider.phone || '';
				// Service providers don't have these fields - user will need to fill manually
				// Only clear when creating a new contract (we already checked contract is null above)
				clientIdDocument = '';
				clientTaxId = '';
				bankName = '';
				accountNumber = '';
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

	// Get selected event and counterparty names
	let eventName = $derived(events.find((e) => e.id === eventId)?.name || '');
	let counterpartyName = $derived(serviceProviders.find((c) => c.id === counterpartyId)?.name || '');

	let isSubmitting = $state(false);
	let error = $state<string | null>(null);
	let showCreateProvider = $state(false);
	let isCreatingProvider = $state(false);

	// New provider form fields
	let newProviderName = $state('');
	let newProviderServiceType = $state('');
	let newProviderEmail = $state('');
	let newProviderPhone = $state('');

	async function handleCreateProvider() {
		if (!authState.user) {
			toast.error('You must be logged in to create a service provider');
			return;
		}

		if (!newProviderName || !newProviderServiceType) {
			toast.error('Please fill in provider name and service type');
			return;
		}

		isCreatingProvider = true;
		try {
			const providerId = await saveCounterparty({
				type: 'service-provider',
				name: newProviderName,
				serviceType: newProviderServiceType,
				email: newProviderEmail || null,
				phone: newProviderPhone || null,
				address: null,
				ownerUid: authState.user.uid,
				notes: null,
				companyName: null,
				typicalDeliverables: [],
				equipmentProvided: [],
				businessLicense: null,
				insuranceInfo: null
			});

			toast.success('Service provider created successfully!');

			// Select the newly created provider
			counterpartyId = providerId;

			// Reset form and hide
			newProviderName = '';
			newProviderServiceType = '';
			newProviderEmail = '';
			newProviderPhone = '';
			showCreateProvider = false;
		} catch (err) {
			console.error('Error creating provider:', err);
			toast.error('Failed to create service provider');
		} finally {
			isCreatingProvider = false;
		}
	}

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
			error = 'Please select a service provider';
			return;
		}

		isSubmitting = true;
		error = null;

		try {
			// Set netFee = contractValue for contract generator compatibility
			// Contract generator expects netFee field
			const netFee = contractValue;

			const contractData: ServiceProvisionContractInput = {
				type: 'service-provision',
				ownerUid: authState.user.uid,
				contractNumber,
				eventId,
				counterpartyId,
				counterpartyName,
				eventName,
				paymentDirection: 'payable',
				paymentStatus,
				contractValue, // Store base amount (before tax)
				currency: 'VND',
				notes: notes || null,
				jobName,
				jobContent,
				numberOfPerformances,
				firstPerformanceTime,
				startDate,
				endDate,
				taxRate,
				netFee, // For contract generator compatibility
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

<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} novalidate class="space-y-6">
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
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				>
					<option value="">Select an event</option>
					{#each events as event}
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
						onclick={() => showCreateProvider = !showCreateProvider}
						class="text-sm text-blue-600 hover:text-blue-700 font-medium"
					>
						{showCreateProvider ? 'Cancel' : '+ Create New'}
					</button>
				</div>
				<select
					id="counterpartyId"
					bind:value={counterpartyId}
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				>
					<option value="">Select a service provider</option>
					{#each serviceProviders as provider}
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
					bind:value={paymentStatus}
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				>
					<option value="unpaid">Unpaid</option>
					<option value="paid">Paid</option>
				</select>
			</div>
		</div>
	</div>

	<!-- Inline Service Provider Creation Form -->
	{#if showCreateProvider}
		<div class="bg-blue-50 border border-blue-200 p-6 rounded-lg">
			<h3 class="text-lg font-semibold text-gray-900 mb-4">Create New Service Provider</h3>
			<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
				<div>
					<label for="newProviderName" class="block text-sm font-medium text-gray-700 mb-1">
						Provider Name <span class="text-red-500">*</span>
					</label>
					<input
						id="newProviderName"
						type="text"
						bind:value={newProviderName}
						placeholder="e.g., ABC Catering Services"
						class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
					/>
				</div>

				<div>
					<label for="newProviderServiceType" class="block text-sm font-medium text-gray-700 mb-1">
						Service Type <span class="text-red-500">*</span>
					</label>
					<input
						id="newProviderServiceType"
						type="text"
						bind:value={newProviderServiceType}
						placeholder="e.g., Catering, Photography, AV Equipment"
						class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
					/>
				</div>

				<div>
					<label for="newProviderEmail" class="block text-sm font-medium text-gray-700 mb-1">
						Email
					</label>
					<input
						id="newProviderEmail"
						type="email"
						bind:value={newProviderEmail}
						placeholder="provider@example.com"
						class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
					/>
				</div>

				<div>
					<label for="newProviderPhone" class="block text-sm font-medium text-gray-700 mb-1">
						Phone
					</label>
					<input
						id="newProviderPhone"
						type="tel"
						bind:value={newProviderPhone}
						placeholder="+84 123 456 789"
						class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
					/>
				</div>
			</div>

			<div class="flex gap-3 justify-end mt-4">
				<button
					type="button"
					onclick={() => {
						showCreateProvider = false;
						newProviderName = '';
						newProviderServiceType = '';
						newProviderEmail = '';
						newProviderPhone = '';
					}}
					class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
				>
					Cancel
				</button>
				<button
					type="button"
					onclick={handleCreateProvider}
					disabled={isCreatingProvider}
					class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
				>
					{isCreatingProvider ? 'Creating...' : 'Create Provider'}
				</button>
			</div>
		</div>
	{/if}

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
		contractValue={contractValue}
		{taxRate}
		oncontractValueChange={(value) => (contractValue = value)}
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
