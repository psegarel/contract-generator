<script lang="ts">
	import type { DjResidencyContract, ClientCounterparty } from '$lib/types/v2';
	import {
		djResidencyContractInputSchema,
		type DjResidencyContractInput
	} from '$lib/schemas/v2/contracts/djResidency';
	import {
		saveDjResidencyContract,
		updateDjResidencyContract
	} from '$lib/utils/v2/djResidencyContracts';
	import { saveCounterparty } from '$lib/utils/v2/counterparties';
	import {
		clientCounterpartySchema,
		type ClientCounterpartyInput
	} from '$lib/schemas/v2/counterparty';
	import { Timestamp } from 'firebase/firestore';
	import { authState } from '$lib/state/auth.svelte';
	import { counterpartyState } from '$lib/state/v2';
	import { DjResidencyContractFormState } from '$lib/state/v2/djResidencyContractFormState.svelte';
	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { logger } from '$lib/utils/logger';
	import TextField from '$lib/components/TextField.svelte';
	import TextareaField from '$lib/components/TextareaField.svelte';
	import SelectField from '$lib/components/SelectField.svelte';
	import FormSection from '$lib/components/FormSection.svelte';
	import FormMessage from '$lib/components/FormMessage.svelte';
	import { formatCurrency } from '$lib/utils/formatting';
	import CreateCounterpartyInline from './sections/CreateCounterpartyInline.svelte';
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
		if (!authState.user) {
			toast.error('You must be logged in to create a counterparty');
			return;
		}

		if (!formState.newCounterpartyName) {
			toast.error('Please fill in counterparty name');
			return;
		}

		formState.isCreatingCounterparty = true;
		try {
			const clientData: ClientCounterpartyInput = {
				type: 'client',
				clientType: 'company',
				ownerUid: authState.user.uid,
				name: formState.newCounterpartyName,
				email: formState.newCounterpartyEmail || null,
				phone: formState.newCounterpartyPhone || null,
				address: formState.newCounterpartyAddress || null,
				companyName: formState.newCounterpartyCompanyName || null,
				taxId: formState.newCounterpartyTaxId || null,
				bankName: formState.newCounterpartyBankName || null,
				bankAccountNumber: formState.newCounterpartyBankAccountNumber || null,
				representativeName: formState.newCounterpartyRepresentativeName || null,
				representativePosition: formState.newCounterpartyRepresentativePosition || null,
				idDocument: null,
				notes: null,
				createdAt: Timestamp.now(),
				updatedAt: Timestamp.now()
			};

			const validationResult = clientCounterpartySchema.safeParse(clientData);
			if (!validationResult.success) {
				toast.error('Validation error: ' + validationResult.error.issues[0].message);
				return;
			}

			const counterpartyId = await saveCounterparty(clientData);

			toast.success('Counterparty created successfully!');

			// Select the newly created counterparty
			formState.counterpartyId = counterpartyId;

			// Reset form and hide (counterparty list will auto-update via subscription)
			formState.resetNewCounterpartyForm();
		} catch (err) {
			logger.error('Error creating counterparty:', err);
			toast.error('Failed to create counterparty');
		} finally {
			formState.isCreatingCounterparty = false;
		}
	}

	async function handleSubmit() {
		if (!authState.user) {
			formState.error = 'You must be logged in to create a contract';
			return;
		}

		if (!formState.counterpartyId) {
			formState.error = 'Please select a counterparty (Party B)';
			return;
		}

		if (!formState.contractStartDate || !formState.contractEndDate) {
			formState.error = 'Please set contract start and end dates';
			return;
		}

		if (!formState.performanceFeeVND || formState.performanceFeeVND <= 0) {
			formState.error = 'Please set a valid hourly rate';
			return;
		}

		formState.isSubmitting = true;
		formState.error = null;

		try {
			const contractData: DjResidencyContractInput = {
				type: 'dj-residency',
				ownerUid: authState.user.uid,
				contractNumber: formState.contractNumber,
				eventId: null,
				counterpartyId: formState.counterpartyId,
				counterpartyName,
				eventName: null,
				paymentDirection: 'receivable',
				paymentStatus: formState.paymentStatus,
				contractValue: 0, // Computed from performance logs via syncContractValue
				currency: 'VND',
				notes: formState.notes || null,

				// Contract Duration
				contractStartDate: formState.contractStartDate,
				contractEndDate: formState.contractEndDate,
				contractDurationMonths: formState.contractDurationMonths,

				// Performance Terms
				performanceDays: formState.performanceDays,
				performanceDaysVietnamese: formState.performanceDaysVietnamese,
				performanceHoursPerSet: formState.performanceHoursPerSet,
				numberOfSetsPerDay: formState.numberOfSetsPerDay,

				// Payment Terms
				performanceFeeVND: formState.performanceFeeVND,
				terminationNoticeDays: formState.terminationNoticeDays,

				// Status
				residencyStatus: formState.residencyStatus
			};

			// Validate with schema
			const validationResult = djResidencyContractInputSchema.safeParse(contractData);
			if (!validationResult.success) {
				formState.error = 'Validation error: ' + validationResult.error.issues[0].message;
				return;
			}

			let contractId: string;
			if (contract) {
				await updateDjResidencyContract(contract.id, contractData);
				contractId = contract.id;
			} else {
				contractId = await saveDjResidencyContract(contractData);
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
		<FormMessage message={formState.error} />
	{/if}

	<!-- Contract Basics -->
	<FormSection title="Contract Information">
		<div class="grid gap-6 grid-cols-1 md:grid-cols-2">
			<TextField
				id="contractNumber"
				label="Contract Number"
				bind:value={formState.contractNumber}
				required
			/>
			<div class="flex items-end gap-2">
				<SelectField
					class="flex-1"
					id="counterpartyId"
					label="Party B"
					bind:value={formState.counterpartyId}
					required
				>
					<option value="">Select counterparty</option>
					{#each venueCounterparties as venue (venue.id)}
						<option value={venue.id}>{venue.name}</option>
					{/each}
				</SelectField>
				<Button
					type="button"
					variant="outline"
					class="mb-1 whitespace-nowrap bg-primary/5 text-primary hover:bg-primary/10"
					onclick={() => (formState.showCreateCounterparty = !formState.showCreateCounterparty)}
				>
					+ Create New
				</Button>
			</div>
		</div>
	</FormSection>

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

	<!-- Contract Duration -->
	<FormSection title="Contract Duration">
		<div class="grid gap-6 grid-cols-1 md:grid-cols-3">
			<TextField
				id="contractStartDate"
				label="Start Date"
				type="date"
				bind:value={formState.contractStartDate}
				onchange={handleStartDateChange}
				required
			/>
			<TextField
				id="contractDurationMonths"
				label="Duration (months)"
				type="number"
				bind:value={formState.contractDurationMonths}
				onchange={handleDurationChange}
				min="1"
				max="24"
				required
			/>
			<TextField
				id="contractEndDate"
				label="End Date"
				type="date"
				bind:value={formState.contractEndDate}
				readonly
				class="[&_input]:bg-muted"
			/>
		</div>
	</FormSection>

	<!-- Performance Terms -->
	<FormSection title="Performance Terms">
		<div class="grid gap-6 grid-cols-1 md:grid-cols-2">
			<TextField
				id="performanceDays"
				label="Performance Days (English)"
				bind:value={formState.performanceDays}
				placeholder="e.g., Saturday and Sunday"
				required
			/>
			<TextField
				id="performanceDaysVietnamese"
				label="Performance Days (Vietnamese)"
				bind:value={formState.performanceDaysVietnamese}
				placeholder="e.g., Thứ Bảy và Chủ Nhật"
				required
			/>
			<TextField
				id="performanceHoursPerSet"
				label="Hours per Set"
				type="number"
				bind:value={formState.performanceHoursPerSet}
				min="1"
				max="12"
				required
			/>
			<TextField
				id="numberOfSetsPerDay"
				label="Sets per Day"
				type="number"
				bind:value={formState.numberOfSetsPerDay}
				min="1"
				max="10"
				required
			/>
		</div>
	</FormSection>

	<!-- Payment Terms -->
	<FormSection title="Payment Terms">
		<div class="grid gap-6 grid-cols-1 md:grid-cols-2">
			<TextField
				id="performanceFeeVND"
				label="Hourly Rate — Client (VND)"
				type="number"
				bind:value={formState.performanceFeeVND}
				min="0"
				required
			/>
			<TextField
				id="terminationNoticeDays"
				label="Termination Notice (days)"
				type="number"
				bind:value={formState.terminationNoticeDays}
				min="1"
				required
			/>
		</div>
		<div class="mt-4 p-4 bg-muted space-y-1">
			<p class="text-sm text-muted-foreground">
				<strong>Est. monthly revenue (client):</strong>
				{formatCurrency(formState.estimatedMonthlyValue)}
				<span class="text-muted-foreground/60">(~8 sets/month)</span>
			</p>
			<p class="text-sm text-muted-foreground">
				<strong>Est. total contract revenue:</strong>
				{formatCurrency(formState.estimatedTotalValue)}
			</p>
		</div>
	</FormSection>

	<!-- Status -->
	<FormSection title="Status">
		<div class="grid gap-6 grid-cols-1 md:grid-cols-2">
			<SelectField
				id="residencyStatus"
				label="Residency Status"
				bind:value={formState.residencyStatus}
				required
			>
				<option value="active">Active</option>
				<option value="completed">Completed</option>
				<option value="terminated">Terminated</option>
			</SelectField>
		</div>
	</FormSection>

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
