<script lang="ts">
	import { onMount } from 'svelte';
	import { Timestamp } from 'firebase/firestore';
	import type { PerformerContractor } from '$lib/types/v2';
	import { performerContractorSchema, type PerformerContractorInput } from '$lib/schemas/v2';
	import { saveCounterparty, updateCounterparty } from '$lib/utils/v2';
	import { authState } from '$lib/state/auth.svelte';
	import { PerformerFormState } from '$lib/state/v2/performerFormState.svelte';
	import { companyConfig } from '$lib/config/company';
	import { Button } from '$lib/components/ui/button';
	import { logger } from '$lib/utils/logger';
	import TextField from '$lib/components/TextField.svelte';
	import TextareaField from '$lib/components/TextareaField.svelte';
	import FormSection from '$lib/components/FormSection.svelte';
	import FormMessage from '$lib/components/FormMessage.svelte';
	import BankNameCombobox from '$lib/components/v2/forms/BankNameCombobox.svelte';

	interface Props {
		performer?: PerformerContractor | null;
		onSuccess?: (performerId: string) => void;
		onCancel?: () => void;
	}

	let { performer = null, onSuccess, onCancel }: Props = $props();

	const formState = new PerformerFormState();

	onMount(() => {
		formState.init(performer);
	});

	async function handleSubmit() {
		if (!authState.user) {
			formState.error = 'You must be logged in to create a performer';
			return;
		}

		formState.isSubmitting = true;
		formState.error = null;

		try {
			const performerData: PerformerContractorInput = {
				type: 'contractor',
				contractorType: 'performer',
				ownerUid: authState.user.uid,
				name: formState.name,
				stageName: formState.stageName,
				performerType: formState.performerType,
				genre: formState.genre || null,
				email: formState.email || null,
				phone: formState.phone || null,
				address: formState.address || null,
				technicalRider: formState.technicalRider || null,
				minPerformanceDuration: formState.minPerformanceDuration,
				travelRequirements: formState.travelRequirements || null,
				agentName: formState.agentName || null,
				agentContact: formState.agentContact || null,
				bankName: formState.bankName || null,
				bankAccountNumber: formState.bankAccountNumber || null,
				idDocument: formState.idDocument || null,
				taxId: formState.taxId || null,
				pitRate: formState.pitRate,
				pitRatePolicy: formState.pitRatePolicy || companyConfig.defaultPerformerPitRatePolicy,
				notes: formState.notes || null,
				createdAt: performer?.createdAt || Timestamp.now(),
				updatedAt: Timestamp.now()
			};

			const validationResult = performerContractorSchema.safeParse(performerData);
			if (!validationResult.success) {
				formState.error = 'Validation error: ' + validationResult.error.issues[0].message;
				return;
			}

			let performerId: string;
			if (performer) {
				await updateCounterparty(performer.id, performerData);
				performerId = performer.id;
			} else {
				performerId = await saveCounterparty(performerData);
			}

			if (onSuccess) {
				onSuccess(performerId);
			}
		} catch (e) {
			logger.error('Error saving performer:', e);
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
	class="space-y-6"
>
	{#if formState.error}
		<FormMessage message={formState.error} />
	{/if}

	<!-- Basic Information -->
	<FormSection title="Basic Information">
		<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
			<TextField
				id="name"
				label="Legal Name"
				bind:value={formState.name}
				required
				placeholder="Full legal name"
			/>

			<TextField
				id="stageName"
				label="Stage Name"
				bind:value={formState.stageName}
				required
				placeholder="DJ Name / Artist Name"
			/>

			<TextField
				id="performerType"
				label="Performer Type"
				bind:value={formState.performerType}
				required
				placeholder="DJ, Band, MC, Dancer, etc."
			/>

			<TextField
				id="genre"
				label="Genre"
				bind:value={formState.genre}
				placeholder="House, Techno, Hip-Hop, etc."
			/>

			<TextField
				id="email"
				label="Email"
				type="email"
				bind:value={formState.email}
				placeholder="performer@example.com"
			/>

			<TextField
				id="phone"
				label="Phone"
				type="tel"
				bind:value={formState.phone}
				placeholder="+84 123 456 789"
			/>

			<TextField
				id="address"
				label="Address"
				bind:value={formState.address}
				placeholder="123 Main St, Ho Chi Minh City"
				class="col-span-full"
			/>
		</div>
	</FormSection>

	<!-- Performance Requirements -->
	<FormSection title="Performance Requirements">
		<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
			<TextareaField
				id="technicalRider"
				label="Technical Rider"
				bind:value={formState.technicalRider}
				rows={3}
				placeholder="Equipment and setup requirements..."
				class="col-span-full"
			/>

			<TextField
				id="minPerformanceDuration"
				label="Min Performance Duration (minutes)"
				type="number"
				value={formState.minPerformanceDuration ?? ''}
				oninput={(e) => {
					const v = (e.target as HTMLInputElement).value;
					formState.minPerformanceDuration = v ? Number(v) : null;
				}}
				placeholder="120"
			/>

			<TextField
				id="travelRequirements"
				label="Travel Requirements"
				bind:value={formState.travelRequirements}
				placeholder="Flight + hotel, local only, etc."
			/>
		</div>
	</FormSection>

	<!-- Booking Details -->
	<FormSection title="Booking Details">
		<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
			<TextField
				id="agentName"
				label="Agent Name"
				bind:value={formState.agentName}
				placeholder="Booking agent name"
			/>

			<TextField
				id="agentContact"
				label="Agent Contact"
				bind:value={formState.agentContact}
				placeholder="Email or phone"
			/>
		</div>
	</FormSection>

	<!-- Payment Details -->
	<FormSection title="Payment Details">
		<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
			<BankNameCombobox id="bankName" label="Bank Name" bind:value={formState.bankName} />

			<TextField
				id="bankAccountNumber"
				label="Bank Account Number"
				bind:value={formState.bankAccountNumber}
				placeholder="1234567890"
			/>

			<TextField
				id="idDocument"
				label="ID Document (Passport/ID Number)"
				bind:value={formState.idDocument}
				placeholder="123456789"
			/>

			<TextField
				id="taxId"
				label="Tax ID"
				bind:value={formState.taxId}
				placeholder="Tax identification number"
			/>

			<TextField
				id="pitRate"
				label="PIT Rate (%)"
				type="number"
				bind:value={formState.pitRate}
				min="0"
				max="100"
				placeholder="10"
			/>
		</div>
	</FormSection>

	<!-- Notes -->
	<FormSection title="Notes">
		<TextareaField
			id="notes"
			label=""
			bind:value={formState.notes}
			rows={4}
			placeholder="Additional notes about this performer..."
		/>
	</FormSection>

	<!-- Form Actions -->
	<div class="flex gap-3 justify-end">
		{#if onCancel}
			<Button type="button" variant="outline" onclick={onCancel} disabled={formState.isSubmitting}>
				Cancel
			</Button>
		{/if}
		<Button type="submit" disabled={formState.isSubmitting} variant="dark">
			{formState.isSubmitting ? 'Saving...' : performer ? 'Update Performer' : 'Create Performer'}
		</Button>
	</div>
</form>
