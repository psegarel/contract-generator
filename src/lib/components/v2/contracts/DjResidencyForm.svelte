<script lang="ts">
	import type { DjResidencyContract, ClientCounterparty } from '$lib/types/v2';
	import { authState } from '$lib/state/auth.svelte';
	import { counterpartyState } from '$lib/state/v2';
	import { DjResidencyContractFormState } from '$lib/state/v2/djResidencyContractFormState.svelte';
	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { logger } from '$lib/utils/logger';
	import TextareaField from '$lib/components/TextareaField.svelte';
	import FormSection from '$lib/components/FormSection.svelte';
	import FormMessage from '$lib/components/FormMessage.svelte';
	import {
		createDjResidencyCounterparty,
		saveDjResidencyForm,
		validateDjResidencyForm
	} from '$lib/forms/contracts/djResidency';
	import CreateCounterpartyInline from './sections/CreateCounterpartyInline.svelte';
	import DjResidencyContractBasicsSection from './sections/DjResidencyContractBasicsSection.svelte';
	import DjResidencyDurationSection from './sections/DjResidencyDurationSection.svelte';
	import DjResidencyPerformanceTermsSection from './sections/DjResidencyPerformanceTermsSection.svelte';
	import DjResidencyPaymentTermsSection from './sections/DjResidencyPaymentTermsSection.svelte';
	import DjResidencyStatusSection from './sections/DjResidencyStatusSection.svelte';
	import DjResidencyPerformanceLog from './DjResidencyPerformanceLog.svelte';

	interface Props {
		contract?: DjResidencyContract | null;
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

	// Get available venue counterparties for selection
	const venueCounterparties = $derived(
		counterpartyState.clients.filter((c) => c.clientType === 'company') as ClientCounterparty[]
	);

	// Create form state instance
	const formState = new DjResidencyContractFormState();

	// Initialize form state from prop on mount
	onMount(() => {
		formState.init(contract);
	});

	// Get selected counterparty name for submission
	let counterpartyName = $derived(
		venueCounterparties.find((c) => c.id === formState.counterpartyId)?.name || ''
	);

	// Update end date when start date or duration changes
	function handleStartDateChange() {
		formState.updateEndDateFromDuration();
	}

	function handleDurationChange() {
		formState.updateEndDateFromDuration();
	}

	async function handleCreateCounterparty() {
		formState.isCreatingCounterparty = true;
		try {
			const counterpartyId = await createDjResidencyCounterparty(
				{
					name: formState.newCounterpartyName,
					email: formState.newCounterpartyEmail,
					phone: formState.newCounterpartyPhone,
					address: formState.newCounterpartyAddress,
					companyName: formState.newCounterpartyCompanyName,
					taxId: formState.newCounterpartyTaxId,
					representativeName: formState.newCounterpartyRepresentativeName,
					representativePosition: formState.newCounterpartyRepresentativePosition,
					bankName: formState.newCounterpartyBankName,
					bankAccountNumber: formState.newCounterpartyBankAccountNumber
				},
				authState.user?.uid
			);

			toast.success('Counterparty created successfully!');

			// Select the newly created counterparty
			formState.counterpartyId = counterpartyId;

			// Reset form and hide (counterparty list will auto-update via subscription)
			formState.resetNewCounterpartyForm();
		} catch (err) {
			logger.error('Error creating counterparty:', err);
			toast.error(err instanceof Error ? err.message : 'Failed to create counterparty');
		} finally {
			formState.isCreatingCounterparty = false;
		}
	}

	async function handleSubmit() {
		const validationError = validateDjResidencyForm(formState, authState.user?.uid);
		if (validationError) {
			formState.error = validationError;
			return;
		}

		formState.isSubmitting = true;
		formState.error = null;

		try {
			const contractId = await saveDjResidencyForm({
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
	<!-- Error message -->
	{#if formState.error}
		<FormMessage message={formState.error} />
	{/if}

	<DjResidencyContractBasicsSection
		{formState}
		{venueCounterparties}
		onCreateCounterparty={() =>
			(formState.showCreateCounterparty = !formState.showCreateCounterparty)}
	/>

	<!-- Inline Counterparty Creation -->
	{#if formState.showCreateCounterparty}
		<CreateCounterpartyInline
			{formState}
			title="Create New Counterparty"
			createButtonLabel="Create Counterparty"
			onCancel={() => {
				formState.showCreateCounterparty = false;
				formState.resetNewCounterpartyForm();
			}}
			onCreate={handleCreateCounterparty}
		/>
	{/if}

	<DjResidencyDurationSection
		{formState}
		onStartDateChange={handleStartDateChange}
		onDurationChange={handleDurationChange}
	/>

	<DjResidencyPerformanceTermsSection {formState} />

	<DjResidencyPaymentTermsSection {formState} />

	<DjResidencyStatusSection {formState} />

	<!-- Notes -->
	<FormSection title="Internal Notes">
		<TextareaField
			id="notes"
			label=""
			bind:value={formState.notes}
			rows={4}
			placeholder="Internal notes..."
		/>
	</FormSection>

	<!-- Performance Log (only show when editing existing contract) -->
	{#if contract}
		<div class="mt-6">
			<DjResidencyPerformanceLog {contract} />
		</div>
	{/if}

	<!-- Form Actions -->
	<div class="flex gap-3 justify-end">
		{#if onCancel}
			<Button type="button" variant="outline" onclick={onCancel} disabled={formState.isSubmitting}>
				Cancel
			</Button>
		{/if}
		<Button type="submit" disabled={formState.isSubmitting} variant="dark">
			{formState.isSubmitting ? 'Saving...' : contract ? 'Update Contract' : 'Create Contract'}
		</Button>
	</div>
</form>
