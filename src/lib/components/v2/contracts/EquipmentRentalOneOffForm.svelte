<script lang="ts">
	import type { EquipmentRentalOneOffContract } from '$lib/types/v2';
	import { authState } from '$lib/state/auth.svelte';
	import { counterpartyState, eventState } from '$lib/state/v2';
	import { EquipmentRentalOneOffContractFormState } from '$lib/state/v2/equipmentRentalOneOffContractFormState.svelte';
	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';
	import { logger } from '$lib/utils/logger';
	import FormMessage from '$lib/components/FormMessage.svelte';
	import {
		saveEquipmentRentalOneOffForm,
		validateEquipmentRentalOneOffForm
	} from '$lib/forms/contracts/equipmentRentalOneOff';
	import EquipmentRentalOneOffBasicsSection from './sections/EquipmentRentalOneOffBasicsSection.svelte';
	import EquipmentRentalOneOffQuotationSection from './sections/EquipmentRentalOneOffQuotationSection.svelte';
	import EquipmentRentalOneOffSetupSection from './sections/EquipmentRentalOneOffSetupSection.svelte';
	import EquipmentRentalOneOffVenueSection from './sections/EquipmentRentalOneOffVenueSection.svelte';
	import EquipmentRentalOneOffFinancialSection from './sections/EquipmentRentalOneOffFinancialSection.svelte';
	import EquipmentRentalOneOffPaymentTermsSection from './sections/EquipmentRentalOneOffPaymentTermsSection.svelte';
	import EquipmentRentalOneOffCancellationSection from './sections/EquipmentRentalOneOffCancellationSection.svelte';
	import EquipmentRentalOneOffEquipmentListSection from './sections/EquipmentRentalOneOffEquipmentListSection.svelte';
	import CounterpartyNotesSection from '../counterparties/sections/CounterpartyNotesSection.svelte';
	import CounterpartyFormActions from '../counterparties/sections/CounterpartyFormActions.svelte';

	interface Props {
		contract?: EquipmentRentalOneOffContract | null;
		initialEventId?: string;
		onSuccess?: (contractId: string) => void;
		onCancel?: () => void;
	}

	let { contract = null, initialEventId = '', onSuccess, onCancel }: Props = $props();

	onMount(() => {
		counterpartyState.init();
		eventState.init();

		return () => {
			counterpartyState.destroy();
			eventState.destroy();
		};
	});

	const counterparties = $derived(counterpartyState.counterparties);
	const events = $derived(eventState.events);

	const formState = new EquipmentRentalOneOffContractFormState();

	onMount(() => {
		formState.init(contract, initialEventId);
	});

	let counterpartyName = $derived(
		counterparties.find((c) => c.id === formState.counterpartyId)?.name || ''
	);

	function handleEventSelect(eventId: string) {
		formState.eventId = eventId || null;
		if (eventId) {
			const event = events.find((e) => e.id === eventId);
			if (event) {
				formState.eventName = event.name;
			}
		}
	}

	async function handleSubmit() {
		const validationError = validateEquipmentRentalOneOffForm(formState, authState.user?.uid);
		if (validationError) {
			formState.error = validationError;
			return;
		}

		formState.isSubmitting = true;
		formState.error = null;

		try {
			const contractId = await saveEquipmentRentalOneOffForm({
				values: formState,
				ownerUid: authState.user!.uid,
				counterpartyName,
				contract
			});

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
	{#if formState.error}
		<FormMessage message={formState.error} />
	{/if}

	<EquipmentRentalOneOffBasicsSection
		{formState}
		{counterparties}
		{events}
		onEventSelect={handleEventSelect}
	/>
	<EquipmentRentalOneOffQuotationSection {formState} />
	<EquipmentRentalOneOffSetupSection {formState} />
	<EquipmentRentalOneOffVenueSection {formState} />
	<EquipmentRentalOneOffFinancialSection {formState} />
	<EquipmentRentalOneOffPaymentTermsSection {formState} />
	<EquipmentRentalOneOffCancellationSection {formState} />
	<EquipmentRentalOneOffEquipmentListSection {formState} />

	<CounterpartyNotesSection bind:value={formState.notes} placeholder="Internal notes..." />
	<CounterpartyFormActions
		isSubmitting={formState.isSubmitting}
		isEditing={Boolean(contract)}
		entityLabel="Contract"
		{onCancel}
	/>
</form>
