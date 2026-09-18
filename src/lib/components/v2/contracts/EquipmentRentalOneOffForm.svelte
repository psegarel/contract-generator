<script lang="ts">
	import type { EquipmentRentalOneOffContract } from '$lib/types/v2';
	import {
		equipmentRentalOneOffContractInputSchema,
		type EquipmentRentalOneOffContractInput
	} from '$lib/schemas/v2/contracts/equipmentRentalOneOff';
	import {
		saveEquipmentRentalOneOffContract,
		updateEquipmentRentalOneOffContract
	} from '$lib/utils/v2/equipmentRentalOneOffContracts';
	import { createOneTimePayment, deletePaymentsByContract } from '$lib/utils/v2/payments';
	import { authState } from '$lib/state/auth.svelte';
	import { counterpartyState, eventState } from '$lib/state/v2';
	import { EquipmentRentalOneOffContractFormState } from '$lib/state/v2/equipmentRentalOneOffContractFormState.svelte';
	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { logger } from '$lib/utils/logger';
	import TextField from '$lib/components/TextField.svelte';
	import TextareaField from '$lib/components/TextareaField.svelte';
	import FormSection from '$lib/components/FormSection.svelte';
	import SelectField from '$lib/components/SelectField.svelte';

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
		if (!authState.user) {
			formState.error = 'You must be logged in to create a contract';
			return;
		}

		if (!formState.counterpartyId) {
			formState.error = 'Please select a counterparty';
			return;
		}

		if (!formState.quotationReference) {
			formState.error = 'Please enter a quotation reference';
			return;
		}

		if (!formState.eventDate) {
			formState.error = 'Please set the event date';
			return;
		}

		if (!formState.setupDateTime || !formState.collectionDateTime) {
			formState.error = 'Please set setup and collection date/times';
			return;
		}

		formState.isSubmitting = true;
		formState.error = null;

		try {
			const contractData: EquipmentRentalOneOffContractInput = {
				type: 'equipment-rental-oneoff',
				ownerUid: authState.user.uid,
				contractNumber: formState.contractNumber,
				eventId: formState.eventId || null,
				counterpartyId: formState.counterpartyId,
				counterpartyName,
				eventName: formState.eventName,
				paymentDirection: 'receivable',
				paymentStatus: formState.paymentStatus,
				contractValue: formState.contractValue,
				currency: 'VND',
				notes: formState.notes || null,
				quotationReference: formState.quotationReference,
				eventDate: formState.eventDate,
				setupDateTime: formState.setupDateTime,
				collectionDateTime: formState.collectionDateTime,
				venueName: formState.venueName,
				venueNameEnglish: formState.venueNameEnglish,
				venueAddress: formState.venueAddress,
				venueAddressEnglish: formState.venueAddressEnglish,
				deposit: formState.deposit,
				vatRate: formState.vatRate,
				replacementValue: formState.replacementValue,
				balancePaymentDays: formState.balancePaymentDays,
				latePaymentPenaltyRate: formState.latePaymentPenaltyRate,
				latePaymentPenaltyCap: formState.latePaymentPenaltyCap,
				cancellationTier1Days: formState.cancellationTier1Days,
				cancellationTier1Percent: formState.cancellationTier1Percent,
				cancellationTier2Days: formState.cancellationTier2Days,
				cancellationTier2Percent: formState.cancellationTier2Percent,
				equipmentList: formState.equipmentList
			};

			const validationResult = equipmentRentalOneOffContractInputSchema.safeParse(contractData);
			if (!validationResult.success) {
				formState.error = 'Validation error: ' + validationResult.error.issues[0].message;
				return;
			}

			let contractId: string;
			if (contract) {
				await updateEquipmentRentalOneOffContract(contract.id, contractData);
				contractId = contract.id;
			} else {
				contractId = await saveEquipmentRentalOneOffContract(contractData);
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
					},
					contractData.eventDate
				);
			} catch (paymentError) {
				logger.error('Error creating payment record:', paymentError);
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
	{#if formState.error}
		<div class="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
			{formState.error}
		</div>
	{/if}

	<!-- Contract Basics -->
	<FormSection title="Contract Basics">
		<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
			<TextField
				id="contractNumber"
				label="Contract Number"
				bind:value={formState.contractNumber}
				placeholder="EQR-20260713-1234"
			/>

			<div>
				<label for="counterpartyId" class="block text-sm font-medium text-foreground mb-1">
					Counterparty <span class="text-destructive">*</span>
				</label>
				<select
					id="counterpartyId"
					bind:value={formState.counterpartyId}
					required
					class="w-full px-3.5 py-2.5 border border-input rounded-md bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring transition-all text-sm"
				>
					<option value="">Select a counterparty</option>
					{#each counterparties as counterparty (counterparty.id)}
						<option value={counterparty.id}>{counterparty.name}</option>
					{/each}
				</select>
			</div>

			<div>
				<label for="eventId" class="block text-sm font-medium text-foreground mb-1">
					Link to Event (optional)
				</label>
				<select
					id="eventId"
					value={formState.eventId || ''}
					onchange={(e) => handleEventSelect(e.currentTarget.value)}
					class="w-full px-3.5 py-2.5 border border-input rounded-md bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring transition-all text-sm"
				>
					<option value="">No event (standalone)</option>
					{#each events as event (event.id)}
						<option value={event.id}>{event.name}</option>
					{/each}
				</select>
				<p class="text-xs text-muted-foreground mt-1">Auto-fills event name below when selected</p>
			</div>

			<SelectField
				id="paymentStatus"
				label="Payment Status"
				bind:value={formState.paymentStatus}
			>
				<option value="unpaid">Unpaid</option>
				<option value="paid">Paid</option>
			</SelectField>
		</div>
	</FormSection>

	<!-- Quotation & Event -->
	<FormSection title="Quotation & Event">
		<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
			<TextField
				id="quotationReference"
				label="Quotation Reference"
				bind:value={formState.quotationReference}
				required
				placeholder="e.g., QT-2026-001"
				helperText="Reference number from the external quotation (PDF/Excel)"
			/>
			<TextField
				id="eventName"
				label="Event Name"
				bind:value={formState.eventName}
				required
				placeholder="e.g., Corporate Gala Dinner"
			/>
			<TextField
				id="eventDate"
				label="Event Date"
				type="date"
				bind:value={formState.eventDate}
				required
			/>
		</div>
	</FormSection>

	<!-- Setup & Collection -->
	<FormSection title="Setup & Collection">
		<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
			<TextField
				id="setupDateTime"
				label="Setup Deadline (delivery, install & test)"
				type="datetime-local"
				bind:value={formState.setupDateTime}
				required
			/>
			<TextField
				id="collectionDateTime"
				label="Collection Deadline (dismantle & collect)"
				type="datetime-local"
				bind:value={formState.collectionDateTime}
				required
			/>
		</div>
	</FormSection>

	<!-- Venue / Delivery Location -->
	<FormSection title="Venue / Delivery Location">
		<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
			<TextField
				id="venueName"
				label="Venue Name (Vietnamese)"
				bind:value={formState.venueName}
				required
			/>
			<TextField
				id="venueNameEnglish"
				label="Venue Name (English)"
				bind:value={formState.venueNameEnglish}
				required
			/>
			<TextField
				id="venueAddress"
				label="Address (Vietnamese)"
				bind:value={formState.venueAddress}
				required
			/>
			<TextField
				id="venueAddressEnglish"
				label="Address (English)"
				bind:value={formState.venueAddressEnglish}
				required
			/>
		</div>
	</FormSection>

	<!-- Financial (NET of VAT) -->
	<FormSection title="Financial (all amounts NET of VAT)">
		<div class="grid gap-4 grid-cols-1 md:grid-cols-3">
			<TextField
				id="contractValue"
				label="Rental Fee (VND, net)"
				type="number"
				bind:value={formState.contractValue}
				required
				min="0"
				helperText="= contractValue"
			/>
			<TextField
				id="deposit"
				label="Deposit (VND, net)"
				type="number"
				bind:value={formState.deposit}
				min="0"
			/>
			<TextField
				id="vatRate"
				label="VAT Rate (%)"
				type="number"
				bind:value={formState.vatRate}
				min="0"
				max="100"
			/>
			<TextField
				id="replacementValue"
				label="Replacement Value (VND, net)"
				type="number"
				bind:value={formState.replacementValue}
				min="0"
				helperText="Total replacement value of equipment"
			/>
		</div>
	</FormSection>

	<!-- Payment Terms -->
	<FormSection title="Payment Terms">
		<div class="grid gap-4 grid-cols-1 md:grid-cols-3">
			<TextField
				id="balancePaymentDays"
				label="Balance Due (days after event)"
				type="number"
				bind:value={formState.balancePaymentDays}
				min="1"
			/>
			<TextField
				id="latePaymentPenaltyRate"
				label="Late Interest (%/day)"
				type="number"
				bind:value={formState.latePaymentPenaltyRate}
				min="0"
				step="0.01"
			/>
			<TextField
				id="latePaymentPenaltyCap"
				label="Late Interest Cap (%)"
				type="number"
				bind:value={formState.latePaymentPenaltyCap}
				min="0"
			/>
		</div>
	</FormSection>

	<!-- Cancellation Terms -->
	<FormSection title="Cancellation Terms">
		<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
			<TextField
				id="cancellationTier1Days"
				label="Tier 1: Cancel before (days)"
				type="number"
				bind:value={formState.cancellationTier1Days}
				min="1"
				helperText="Cancel this many+ days before event"
			/>
			<TextField
				id="cancellationTier1Percent"
				label="Tier 1: Fee owed (%)"
				type="number"
				bind:value={formState.cancellationTier1Percent}
				min="0"
				max="100"
			/>
			<TextField
				id="cancellationTier2Days"
				label="Tier 2: Cancel within (days)"
				type="number"
				bind:value={formState.cancellationTier2Days}
				min="1"
				helperText="Cancel within this many days of event"
			/>
			<TextField
				id="cancellationTier2Percent"
				label="Tier 2: Fee owed (%)"
				type="number"
				bind:value={formState.cancellationTier2Percent}
				min="0"
				max="100"
			/>
		</div>
	</FormSection>

	<!-- Equipment List (Annex 1) -->
	<FormSection title="Equipment List (Annex 1)">
		<TextareaField
			id="equipmentList"
			label="Equipment items"
			bind:value={formState.equipmentList}
			rows={6}
			required
			placeholder="List the equipment items that will appear in Annex 1..."
			helperText="This text is inserted into the Annex 1 section of the contract"
		/>
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

	<!-- Form Actions -->
	<div class="flex gap-3 justify-end">
		{#if onCancel}
			<Button
				variant="outline"
				type="button"
				onclick={onCancel}
				disabled={formState.isSubmitting}
			>
				Cancel
			</Button>
		{/if}
		<Button type="submit" disabled={formState.isSubmitting} variant="dark">
			{formState.isSubmitting ? 'Saving...' : contract ? 'Update Contract' : 'Create Contract'}
		</Button>
	</div>
</form>
