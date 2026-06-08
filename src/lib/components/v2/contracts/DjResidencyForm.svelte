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
			formState.error = 'Please set a valid performance fee';
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
				contractValue: 0, // DJ Residency has no fixed value initially
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

			toast.success(
				contract ? 'Contract updated successfully!' : 'Contract created successfully!'
			);

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
	<div class="bg-white p-6 rounded-lg border border-gray-200">
		<h3 class="text-lg font-semibold text-gray-900 mb-6">Contract Information</h3>
		<div class="grid gap-6 grid-cols-1 md:grid-cols-2">
			<TextField
				id="contractNumber"
				label="Contract Number"
				bind:value={formState.contractNumber}
				required
			/>
			<div>
				<label for="counterpartyId" class="block text-sm font-medium text-gray-700 mb-1">
					Party B <span class="text-red-500">*</span>
				</label>
				<div class="flex gap-2">
					<select
						id="counterpartyId"
						bind:value={formState.counterpartyId}
						required
						class="flex-1 px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
					>
						<option value="">Select counterparty</option>
						{#each venueCounterparties as venue (venue.id)}
							<option value={venue.id}>{venue.name}</option>
						{/each}
					</select>
					<button
						type="button"
						onclick={() => (formState.showCreateCounterparty = !formState.showCreateCounterparty)}
						class="px-3 py-2.5 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-md hover:bg-blue-100 whitespace-nowrap"
					>
						+ Create New
					</button>
				</div>
			</div>
		</div>
	</div>

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
	<div class="bg-white p-6 rounded-lg border border-gray-200">
		<h3 class="text-lg font-semibold text-gray-900 mb-6">Contract Duration</h3>
		<div class="grid gap-6 grid-cols-1 md:grid-cols-3">
			<div>
				<label for="contractStartDate" class="block text-sm font-medium text-gray-700 mb-1">
					Start Date <span class="text-red-500">*</span>
				</label>
				<input
					id="contractStartDate"
					type="date"
					bind:value={formState.contractStartDate}
					onchange={handleStartDateChange}
					required
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				/>
			</div>
			<div>
				<label for="contractDurationMonths" class="block text-sm font-medium text-gray-700 mb-1">
					Duration (months) <span class="text-red-500">*</span>
				</label>
				<input
					id="contractDurationMonths"
					type="number"
					bind:value={formState.contractDurationMonths}
					onchange={handleDurationChange}
					min="1"
					max="24"
					required
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				/>
			</div>
			<div>
				<label for="contractEndDate" class="block text-sm font-medium text-gray-700 mb-1">
					End Date
				</label>
				<input
					id="contractEndDate"
					type="date"
					bind:value={formState.contractEndDate}
					readonly
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md bg-gray-50"
				/>
			</div>
		</div>
	</div>

	<!-- Performance Terms -->
	<div class="bg-white p-6 rounded-lg border border-gray-200">
		<h3 class="text-lg font-semibold text-gray-900 mb-6">Performance Terms</h3>
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
			<div>
				<label for="performanceHoursPerSet" class="block text-sm font-medium text-gray-700 mb-1">
					Hours per Set <span class="text-red-500">*</span>
				</label>
				<input
					id="performanceHoursPerSet"
					type="number"
					bind:value={formState.performanceHoursPerSet}
					min="1"
					max="12"
					required
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				/>
			</div>
			<div>
				<label for="numberOfSetsPerDay" class="block text-sm font-medium text-gray-700 mb-1">
					Sets per Day <span class="text-red-500">*</span>
				</label>
				<input
					id="numberOfSetsPerDay"
					type="number"
					bind:value={formState.numberOfSetsPerDay}
					min="1"
					max="10"
					required
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				/>
			</div>
		</div>
	</div>

	<!-- Payment Terms -->
	<div class="bg-white p-6 rounded-lg border border-gray-200">
		<h3 class="text-lg font-semibold text-gray-900 mb-6">Payment Terms</h3>
		<div class="grid gap-6 grid-cols-1 md:grid-cols-2">
			<div>
				<label for="performanceFeeVND" class="block text-sm font-medium text-gray-700 mb-1">
					Fee per Performance (VND) <span class="text-red-500">*</span>
				</label>
				<input
					id="performanceFeeVND"
					type="number"
					bind:value={formState.performanceFeeVND}
					min="0"
					required
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				/>
			</div>
			<div>
				<label for="terminationNoticeDays" class="block text-sm font-medium text-gray-700 mb-1">
					Termination Notice (days) <span class="text-red-500">*</span>
				</label>
				<input
					id="terminationNoticeDays"
					type="number"
					bind:value={formState.terminationNoticeDays}
					min="1"
					required
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				/>
			</div>
		</div>
		<div class="mt-4 p-4 bg-gray-50 rounded-lg">
			<p class="text-sm text-gray-600">
				<strong>Estimated Monthly Value:</strong>
				{formatCurrency(formState.estimatedMonthlyValue)}
				<span class="text-gray-400">(~8 performances/month)</span>
			</p>
			<p class="text-sm text-gray-600 mt-1">
				<strong>Estimated Total Contract Value:</strong>
				{formatCurrency(formState.estimatedTotalValue)}
			</p>
		</div>
	</div>

	<!-- Status -->
	<div class="bg-white p-6 rounded-lg border border-gray-200">
		<h3 class="text-lg font-semibold text-gray-900 mb-6">Status</h3>
		<div class="grid gap-6 grid-cols-1 md:grid-cols-2">
			<div>
				<label for="residencyStatus" class="block text-sm font-medium text-gray-700 mb-1">
					Residency Status <span class="text-red-500">*</span>
				</label>
				<select
					id="residencyStatus"
					bind:value={formState.residencyStatus}
					required
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				>
					<option value="active">Active</option>
					<option value="completed">Completed</option>
					<option value="terminated">Terminated</option>
				</select>
			</div>
		</div>
	</div>

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

	<!-- Performance Log (only show when editing existing contract) -->
	{#if contract}
		<div class="mt-6">
			<DjResidencyPerformanceLog {contract} />
		</div>
	{/if}

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
