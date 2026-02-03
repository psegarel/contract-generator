<script lang="ts">
	import type { ServiceProvisionContract } from '$lib/types/v2';
	import {
		serviceProvisionContractInputSchema,
		type ServiceProvisionContractInput
	} from '$lib/schemas/v2/contracts/serviceProvision';
	import { saveServiceProvisionContract, updateServiceProvisionContract } from '$lib/utils/v2';
	import { createOneTimePayment, deletePaymentsByContract } from '$lib/utils/v2/payments';
	import { saveCounterparty } from '$lib/utils/v2/counterparties';
	import { authState } from '$lib/state/auth.svelte';
	import { eventState, counterpartyState } from '$lib/state/v2';
	import { ServiceProvisionContractFormState } from '$lib/state/v2/serviceProvisionContractFormState.svelte';
	import { toast } from 'svelte-sonner';
	import { Timestamp } from 'firebase/firestore';
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { logger } from '$lib/utils/logger';
	import ContractBasicsSection from './sections/ContractBasicsSection.svelte';
	import CreateProviderInline from './sections/CreateProviderInline.svelte';
	import ServiceDetailsSection from './sections/ServiceDetailsSection.svelte';
	import FinancialSection from './sections/FinancialSection.svelte';
	import BankingSection from './sections/BankingSection.svelte';
	import ClientInfoSection from './sections/ClientInfoSection.svelte';

	interface Props {
		contract?: ServiceProvisionContract | null;
		initialEventId?: string;
		onSuccess?: (contractId: string) => void;
		onCancel?: () => void;
	}

	let { contract = null, initialEventId = '', onSuccess, onCancel }: Props = $props();

	// Initialize event and counterparty state
	onMount(() => {
		eventState.init();
		counterpartyState.init();

		return () => {
			eventState.destroy();
			counterpartyState.destroy();
		};
	});

	// Get available events and service providers for selection
	const events = $derived(eventState.events);
	const serviceProviders = $derived(
		counterpartyState.counterparties.filter((c) => c.type === 'service-provider')
	);

	// Create form state instance
	const formState = new ServiceProvisionContractFormState();

	// Initialize form state from prop on mount
	onMount(() => {
		formState.init(contract, initialEventId);
	});

	// Get selected event and counterparty names for submission
	let eventName = $derived(events.find((e) => e.id === formState.eventId)?.name || '');
	let counterpartyName = $derived(
		serviceProviders.find((c) => c.id === formState.counterpartyId)?.name || ''
	);

	// Handle counterparty change - auto-fill client details for new contracts only
	function handleCounterpartyChange() {
		// Only auto-fill for new contracts
		if (!contract && formState.counterpartyId && serviceProviders.length > 0) {
			const selectedProvider = serviceProviders.find((c) => c.id === formState.counterpartyId);
			if (selectedProvider) {
				formState.fillFromServiceProvider(selectedProvider);
			}
		}
	}

	async function handleCreateProvider() {
		if (!authState.user) {
			toast.error('You must be logged in to create a service provider');
			return;
		}

		if (!formState.newProviderName || !formState.newProviderServiceType) {
			toast.error('Please fill in provider name and service type');
			return;
		}

		formState.isCreatingProvider = true;
		try {
			const providerId = await saveCounterparty({
				type: 'service-provider',
				name: formState.newProviderName,
				serviceType: formState.newProviderServiceType,
				email: formState.newProviderEmail || null,
				phone: formState.newProviderPhone || null,
				address: null,
				ownerUid: authState.user.uid,
				notes: null,
				companyName: null,
				typicalDeliverables: [],
				equipmentProvided: [],
				businessLicense: null,
				insuranceInfo: null,
				createdAt: Timestamp.now(),
				updatedAt: Timestamp.now()
			});

			toast.success('Service provider created successfully!');

			// Select the newly created provider
			formState.counterpartyId = providerId;

			// Reset form and hide
			formState.resetNewProviderForm();
		} catch (err) {
			logger.error('Error creating provider:', err);
			toast.error('Failed to create service provider');
		} finally {
			formState.isCreatingProvider = false;
		}
	}

	async function handleSubmit() {
		if (!authState.user) {
			formState.error = 'You must be logged in to create a contract';
			return;
		}

		if (!formState.eventId) {
			formState.error = 'Please select an event';
			return;
		}

		if (!formState.counterpartyId) {
			formState.error = 'Please select a service provider';
			return;
		}

		formState.isSubmitting = true;
		formState.error = null;

		try {
			// Set netFee = contractValue for contract generator compatibility
			const netFee = formState.contractValue;

			const contractData: ServiceProvisionContractInput = {
				type: 'service-provision',
				ownerUid: authState.user.uid,
				contractNumber: formState.contractNumber,
				eventId: formState.eventId,
				counterpartyId: formState.counterpartyId,
				counterpartyName,
				eventName,
				paymentDirection: 'payable',
				paymentStatus: formState.paymentStatus,
				contractValue: formState.contractValue,
				currency: 'VND',
				notes: formState.notes || null,
				jobName: formState.jobName,
				jobContent: formState.jobContent,
				numberOfPerformances: formState.numberOfPerformances,
				firstPerformanceTime: formState.firstPerformanceTime,
				startDate: formState.startDate,
				endDate: formState.endDate,
				taxRate: formState.taxRate,
				netFee,
				status: formState.status,
				bankName: formState.bankName,
				accountNumber: formState.accountNumber,
				clientEmail: formState.clientEmail,
				clientAddress: formState.clientAddress,
				clientPhone: formState.clientPhone,
				clientIdDocument: formState.clientIdDocument,
				clientTaxId: formState.clientTaxId || null,
				eventLocation: formState.eventLocation,
				paymentDueDate: formState.paymentDueDate || formState.startDate
			};

			// Validate with schema
			const validationResult = serviceProvisionContractInputSchema.safeParse(contractData);
			if (!validationResult.success) {
				formState.error = 'Validation error: ' + validationResult.error.issues[0].message;
				return;
			}

			let contractId: string;
			if (contract) {
				await updateServiceProvisionContract(contract.id, contractData);
				contractId = contract.id;
			} else {
				contractId = await saveServiceProvisionContract(contractData);
			}

			// Create/recreate payment record
			try {
				if (contract) {
					await deletePaymentsByContract(contractId);
				}
				await createOneTimePayment(
					{
						id: contractId,
						type: contractData.type,
						contractNumber: contractData.contractNumber,
						counterpartyName: contractData.counterpartyName,
						paymentDirection: contractData.paymentDirection,
						paymentStatus: contractData.paymentStatus,
						contractValue: contractData.contractValue,
						currency: contractData.currency,
						ownerUid: contractData.ownerUid
					} as any,
					contractData.paymentDueDate
				);
			} catch (paymentError) {
				logger.error('Error creating payment record:', paymentError);
			}

			if (onSuccess) {
				onSuccess(contractId);
			}
		} catch (e) {
			logger.error('Error saving contract:', e);
			formState.error = (e as Error).message;
		} finally {
			formState.isSubmitting = false;
		}
	}
</script>

<form
	onsubmit={(e) => {
		e.preventDefault();
		handleSubmit();
	}}
	novalidate
	class="space-y-6"
>
	<!-- Error message -->
	{#if formState.error}
		<div class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
			{formState.error}
		</div>
	{/if}

	<!-- Contract Basics -->
	<ContractBasicsSection
		{formState}
		{events}
		{serviceProviders}
		onCreateProviderClick={() => (formState.showCreateProvider = !formState.showCreateProvider)}
		onCounterpartyChange={handleCounterpartyChange}
	/>

	<!-- Inline Service Provider Creation Form -->
	{#if formState.showCreateProvider}
		<CreateProviderInline
			{formState}
			onCancel={() => {
				formState.showCreateProvider = false;
				formState.resetNewProviderForm();
			}}
			onCreate={handleCreateProvider}
		/>
	{/if}

	<!-- Service Details Section -->
	<ServiceDetailsSection {formState} />

	<!-- Financial Section -->
	<FinancialSection {formState} />

	<!-- Banking Section -->
	<BankingSection {formState} />

	<!-- Client Info Section -->
	<ClientInfoSection {formState} />

	<!-- Notes -->
	<div class="bg-white p-6 rounded-lg border border-gray-200">
		<h3 class="text-lg font-semibold text-gray-900 mb-4">Internal Notes</h3>
		<textarea
			id="notes"
			bind:value={formState.notes}
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
				disabled={formState.isSubmitting}
				class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
			>
				Cancel
			</button>
		{/if}
		<Button type="submit" disabled={formState.isSubmitting} variant="dark">
			{formState.isSubmitting ? 'Saving...' : contract ? 'Update Contract' : 'Create Contract'}
		</Button>
	</div>
</form>
