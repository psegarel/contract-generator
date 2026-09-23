<script lang="ts">
	import type { EquipmentRentalContract } from '$lib/types/v2';
	import { saveEquipmentRentalForm } from '$lib/forms/contracts/equipmentRental';
	import { authState } from '$lib/state/auth.svelte';
	import { counterpartyState } from '$lib/state/v2';
	import { EquipmentRentalContractFormState } from '$lib/state/v2/equipmentRentalContractFormState.svelte';
	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';
	import { logger } from '$lib/utils/logger';
	import FormMessage from '$lib/components/FormMessage.svelte';
	import { createInlineClient } from '$lib/forms/counterparties/client';
	import EquipmentRentalContractBasicsSection from './sections/EquipmentRentalContractBasicsSection.svelte';
	import EquipmentRentalPeriodSection from './sections/EquipmentRentalPeriodSection.svelte';
	import EquipmentRentalListSection from './sections/EquipmentRentalListSection.svelte';
	import EquipmentRentalTermsSection from './sections/EquipmentRentalTermsSection.svelte';
	import EquipmentRentalLogisticsSection from './sections/EquipmentRentalLogisticsSection.svelte';
	import CreateCounterpartyInline from './sections/CreateCounterpartyInline.svelte';
	import CounterpartyNotesSection from '../counterparties/sections/CounterpartyNotesSection.svelte';
	import CounterpartyFormActions from '../counterparties/sections/CounterpartyFormActions.svelte';

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
			const counterpartyId = await createInlineClient(
				{
					name: formState.newCounterpartyName,
					email: formState.newCounterpartyEmail,
					phone: formState.newCounterpartyPhone,
					address: formState.newCounterpartyAddress,
					companyName: formState.newCounterpartyCompanyName,
					taxId: formState.newCounterpartyTaxId,
					bankName: formState.newCounterpartyBankName,
					bankAccountNumber: formState.newCounterpartyBankAccountNumber,
					representativeName: formState.newCounterpartyRepresentativeName,
					representativePosition: formState.newCounterpartyRepresentativePosition
				},
				authState.user.uid
			);

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

		formState.isSubmitting = true;
		formState.error = null;

		try {
			const contractId = await saveEquipmentRentalForm({
				values: {
					...formState,
					contractValue: formState.calculatedContractValue
				},
				ownerUid: authState.user.uid,
				counterpartyName,
				contract
			});

			toast.success(contract ? 'Contract updated successfully!' : 'Contract created successfully!');
			onSuccess?.(contractId);
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
		<FormMessage message={formState.error} />
	{/if}

	<!-- Contract Basics -->
	<EquipmentRentalContractBasicsSection
		{formState}
		{counterparties}
		onCreateCounterpartyClick={() =>
			(formState.showCreateCounterparty = !formState.showCreateCounterparty)}
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

	<CounterpartyNotesSection bind:value={formState.notes} placeholder="Internal notes..." />
	<CounterpartyFormActions
		isSubmitting={formState.isSubmitting}
		isEditing={Boolean(contract)}
		entityLabel="Contract"
		{onCancel}
	/>
</form>
