<script lang="ts">
	import type { EquipmentRentalContract } from '$lib/types/v2';
	import {
		equipmentRentalContractInputSchema,
		type EquipmentRentalContractInput
	} from '$lib/schemas/v2/contracts/equipmentRental';
	import {
		saveEquipmentRentalContract,
		updateEquipmentRentalContract
	} from '$lib/utils/v2/equipmentRentalContracts';
	import { authState } from '$lib/state/auth.svelte';
	import { counterpartyState } from '$lib/state/v2';
	import { EquipmentRentalContractFormState } from '$lib/state/v2/equipmentRentalContractFormState.svelte';
	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { logger } from '$lib/utils/logger';
	import TextareaField from '$lib/components/TextareaField.svelte';
	import { saveCounterparty } from '$lib/utils/v2/counterparties';
	import { clientCounterpartySchema, type ClientCounterpartyInput } from '$lib/schemas/v2';
	import { Timestamp } from 'firebase/firestore';
	import EquipmentRentalContractBasicsSection from './sections/EquipmentRentalContractBasicsSection.svelte';
	import EquipmentRentalPeriodSection from './sections/EquipmentRentalPeriodSection.svelte';
	import EquipmentRentalListSection from './sections/EquipmentRentalListSection.svelte';
	import EquipmentRentalTermsSection from './sections/EquipmentRentalTermsSection.svelte';
	import EquipmentRentalLogisticsSection from './sections/EquipmentRentalLogisticsSection.svelte';
	import CreateCounterpartyInline from './sections/CreateCounterpartyInline.svelte';

	interface Props {
		contract?: EquipmentRentalContract | null;
		onSuccess?: (contractId: string) => void;
		onCancel?: () => void;
	}

	let { contract = null, onSuccess, onCancel }: Props = $props();

	// Initialize counterparty state
	onMount(() => {
		counterpartyState.init();

		return () => {
			counterpartyState.destroy();
		};
	});

	// Get available counterparties for selection
	const counterparties = $derived(counterpartyState.counterparties);

	// Create form state instance
	const formState = new EquipmentRentalContractFormState();

	// Initialize form state from prop on mount
	onMount(() => {
		formState.init(contract);
	});

	// Get selected counterparty name for submission
	let counterpartyName = $derived(
		counterparties.find((c) => c.id === formState.counterpartyId)?.name || ''
	);

	// Handle counterparty change - auto-fill details for new contracts only
	function handleCounterpartyChange() {
		// Only auto-fill for new contracts
		if (!contract && formState.counterpartyId && counterparties.length > 0) {
			const selectedCounterparty = counterparties.find((c) => c.id === formState.counterpartyId);
			if (selectedCounterparty) {
				formState.fillFromCounterparty(selectedCounterparty);
			}
		}
	}

	async function handleCreateCounterparty() {
		if (!authState.user) {
			toast.error('You must be logged in to create a client');
			return;
		}

		if (!formState.newCounterpartyName) {
			toast.error('Please fill in client name');
			return;
		}

		formState.isCreatingCounterparty = true;
		try {
		const clientData: ClientCounterpartyInput = {
			type: 'client',
			ownerUid: authState.user.uid,
			name: formState.newCounterpartyName,
			email: formState.newCounterpartyEmail || null,
			phone: formState.newCounterpartyPhone || null,
			address: formState.newCounterpartyAddress || null,
			clientType: 'company', // Equipment rental is always for companies
			companyName: formState.newCounterpartyCompanyName || null,
			representativeName: formState.newCounterpartyRepresentativeName || null,
			representativePosition: formState.newCounterpartyRepresentativePosition || null,
			idDocument: null,
			taxId: formState.newCounterpartyTaxId || null,
			bankName: formState.newCounterpartyBankName || null,
			bankAccountNumber: formState.newCounterpartyBankAccountNumber || null,
			notes: null,
			createdAt: Timestamp.now(),
			updatedAt: Timestamp.now()
		};

			// Validate with schema
			const validationResult = clientCounterpartySchema.safeParse(clientData);
			if (!validationResult.success) {
				toast.error('Validation error: ' + validationResult.error.issues[0].message);
				return;
			}

			const counterpartyId = await saveCounterparty(clientData);

			toast.success('Client created successfully!');

			// Select the newly created counterparty
			formState.counterpartyId = counterpartyId;

			// Reset form and hide (counterparty list will auto-update via subscription)
			formState.resetNewCounterpartyForm();
		} catch (err) {
			logger.error('Error creating client:', err);
			toast.error('Failed to create client');
		} finally {
			formState.isCreatingCounterparty = false;
		}
	}

	async function handleSubmit() {
		if (!authState.user) {
			formState.error = 'You must be logged in to create a contract';
			return;
		}

		// Event is optional for equipment rental (standalone contracts allowed)
		// if (!formState.eventId) {
		// 	formState.error = 'Please select an event';
		// 	return;
		// }

		if (!formState.counterpartyId) {
			formState.error = 'Please select a counterparty';
			return;
		}

		if (formState.equipment.length === 0) {
			formState.error = 'Please add at least one equipment item';
			return;
		}

		// Validate equipment items
		for (let i = 0; i < formState.equipment.length; i++) {
			const item = formState.equipment[i];
			if (!item.name || item.quantity <= 0 || item.unitPrice < 0) {
				formState.error = `Equipment item #${i + 1} is incomplete. Please fill in all required fields.`;
				return;
			}
		}

		formState.isSubmitting = true;
		formState.error = null;

		try {
			// Calculate contract value from equipment + delivery fee
			const contractValue = formState.calculatedContractValue;

			const contractData: EquipmentRentalContractInput = {
				type: 'equipment-rental',
				ownerUid: authState.user.uid,
				contractNumber: formState.contractNumber,
				eventId: null, // Equipment rental contracts are always standalone
				counterpartyId: formState.counterpartyId,
				counterpartyName,
				eventName: null, // Equipment rental contracts are always standalone
				paymentDirection: 'receivable', // Equipment rental contracts are always receivable
				paymentStatus: formState.paymentStatus,
				contractValue,
				currency: 'VND',
				notes: formState.notes || '',
				rentalStartDate: formState.rentalStartDate,
				rentalEndDate: formState.rentalEndDate,
				equipment: formState.equipment,
				monthlyRent: formState.monthlyRent,
				securityDeposit: formState.securityDeposit,
				damageWaiver: formState.damageWaiver,
				deliveryFee: formState.deliveryFee,
				venueName: formState.venueName,
				venueNameEnglish: formState.venueNameEnglish,
				venueAddress: formState.venueAddress,
				venueAddressEnglish: formState.venueAddressEnglish
			};

			// Validate with schema
			const validationResult = equipmentRentalContractInputSchema.safeParse(contractData);
			if (!validationResult.success) {
				formState.error = 'Validation error: ' + validationResult.error.issues[0].message;
				return;
			}

			let contractId: string;
			if (contract) {
				await updateEquipmentRentalContract(contract.id, contractData);
				contractId = contract.id;
			} else {
				contractId = await saveEquipmentRentalContract(contractData);
			}

			toast.success(contract ? 'Contract updated successfully!' : 'Contract created successfully!');

			if (onSuccess) {
				onSuccess(contractId);
			}
		} catch (e) {
			logger.error('Error saving contract:', e);
			formState.error = (e as Error).message;
			toast.error('Failed to save contract');
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
	<EquipmentRentalContractBasicsSection
		{formState}
		{counterparties}
		onCreateCounterpartyClick={() => (formState.showCreateCounterparty = !formState.showCreateCounterparty)}
		onCounterpartyChange={handleCounterpartyChange}
	/>

	<!-- Inline Counterparty Creation Form -->
	{#if formState.showCreateCounterparty}
		<CreateCounterpartyInline
			{formState}
			onCancel={() => {
				formState.showCreateCounterparty = false;
				formState.resetNewCounterpartyForm();
			}}
			onCreate={handleCreateCounterparty}
		/>
	{/if}

	<!-- Rental Period -->
	<EquipmentRentalPeriodSection {formState} />

	<!-- Rental Terms -->
	<EquipmentRentalTermsSection {formState} />

	<!-- Logistics -->
	<EquipmentRentalLogisticsSection {formState} />

	<!-- Equipment List -->
	<EquipmentRentalListSection {formState} />

	<!-- Notes -->
	<div class="bg-white p-6 rounded-lg border border-gray-200">
		<h3 class="text-lg font-semibold text-gray-900 mb-4">Internal Notes</h3>
		<TextareaField
			id="notes"
			label=""
			bind:value={formState.notes}
			rows={4}
			placeholder="Internal notes..."
		/>
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


