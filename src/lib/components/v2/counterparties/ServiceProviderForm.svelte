<script lang="ts">
	import type { ServiceProviderContractor } from '$lib/types/v2';
	import {
		serviceProviderContractorSchema,
		type ServiceProviderContractorInput
	} from '$lib/schemas/v2';
	import { saveCounterparty, updateCounterparty } from '$lib/utils/v2';
	import { authState } from '$lib/state/auth.svelte';
	import { ServiceProviderFormState } from '$lib/state/v2/serviceProviderFormState.svelte';
	import { onMount } from 'svelte';
	import { Timestamp } from 'firebase/firestore';
	import { Button } from '$lib/components/ui/button';
	import { logger } from '$lib/utils/logger';
	import TextField from '$lib/components/TextField.svelte';
	import TextareaField from '$lib/components/TextareaField.svelte';
	import FormSection from '$lib/components/FormSection.svelte';
	import FileUpload from '$lib/components/FileUpload.svelte';
	import { CounterpartyDocumentManager } from '$lib/utils/counterpartyDocuments';
	import { toast } from 'svelte-sonner';
	import BankNameCombobox from '$lib/components/v2/forms/BankNameCombobox.svelte';

	interface Props {
		serviceProvider?: ServiceProviderContractor | null;
		onSuccess?: (serviceProviderId: string) => void;
		onCancel?: () => void;
	}

	let { serviceProvider = null, onSuccess, onCancel }: Props = $props();

	// Create form state instance
	const formState = new ServiceProviderFormState();

	// Generate counterparty ID early for immediate upload capability (if creating new)
	let counterpartyId = $state<string | null>(null);

	// Initialize form state from prop (one-time initialization on mount)
	onMount(() => {
		formState.init(serviceProvider);
		if (serviceProvider?.id) {
			counterpartyId = serviceProvider.id;
		} else if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
			// Generate ID for new counterparty to enable immediate uploads
			counterpartyId = window.crypto.randomUUID();
		}
	});

	// Document manager instance (created when counterpartyId is available)
	let documentManager = $derived(
		counterpartyId ? new CounterpartyDocumentManager(counterpartyId) : null
	);

	// Handle file upload for a specific image number
	async function handleFileUpload(file: File, imageNumber: 1 | 2 | 3 | 4 | 5) {
		if (!authState.user || !documentManager) {
			toast.error('Unable to upload: missing authentication or counterparty ID');
			return;
		}

		formState.setUploading(imageNumber, true);

		try {
			const metadata = await documentManager.uploadDocument(file, imageNumber, authState.user.uid);
			formState.setDocument(imageNumber, metadata);
			toast.success(`Document ${imageNumber} uploaded successfully`);
		} catch (error) {
			logger.error('Error uploading document:', error);
			toast.error('Failed to upload document: ' + (error as Error).message);
		} finally {
			formState.setUploading(imageNumber, false);
		}
	}

	// Handle file deletion for a specific image number
	async function handleFileDelete(imageNumber: 1 | 2 | 3 | 4 | 5) {
		if (!documentManager) {
			toast.error('Unable to delete: missing counterparty ID');
			return;
		}

		try {
			await documentManager.deleteDocument(imageNumber);
			formState.setDocument(imageNumber, undefined);
			toast.success(`Document ${imageNumber} deleted`);
		} catch (error) {
			logger.error('Error deleting document:', error);
			toast.error('Failed to delete document');
		}
	}

	async function handleSubmit() {
		if (!authState.user) {
			formState.error = 'You must be logged in to create a service provider';
			return;
		}

		formState.isSubmitting = true;
		formState.error = null;

		try {
			const serviceProviderData: ServiceProviderContractorInput = {
				type: 'contractor',
				contractorType: 'service-provider',
				ownerUid: authState.user.uid,
				name: formState.name,
				email: formState.email || null,
				phone: formState.phone || null,
				address: formState.address || null,
				serviceType: formState.serviceType,
				companyName: formState.companyName || null,
				typicalDeliverables: formState.typicalDeliverables,
				equipmentProvided: formState.equipmentProvided,
				businessLicense: formState.businessLicense || null,
				insuranceInfo: formState.insuranceInfo || null,
				taxId: formState.taxId || null,
				bankName: formState.bankName || null,
				bankAccountNumber: formState.bankAccountNumber || null,
				idDocument: formState.idDocument || null,
				notes: formState.notes || null,
				documents: Object.keys(formState.documents).length > 0 ? formState.documents : undefined,
				// Timestamps: when creating use Timestamp.now(), when editing preserve createdAt
				createdAt: serviceProvider?.createdAt || Timestamp.now(),
				updatedAt: Timestamp.now()
			};

			// Validate with schema
			const validationResult = serviceProviderContractorSchema.safeParse(serviceProviderData);
			if (!validationResult.success) {
				formState.error = 'Validation error: ' + validationResult.error.issues[0].message;
				return;
			}

			let serviceProviderId: string;
			if (serviceProvider) {
				await updateCounterparty(serviceProvider.id, serviceProviderData);
				serviceProviderId = serviceProvider.id;
			} else {
				serviceProviderId = await saveCounterparty(serviceProviderData);
				// Update counterpartyId for future reference
				counterpartyId = serviceProviderId;
			}

			if (onSuccess) {
				onSuccess(serviceProviderId);
			}
		} catch (e) {
			logger.error('Error saving service provider:', e);
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
	<!-- Error message -->
	{#if formState.error}
		<div
			class="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm"
		>
			{formState.error}
		</div>
	{/if}

	<!-- Basic Information -->
	<FormSection title="Basic Information">
		<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
			<TextField
				id="name"
				label="Name"
				bind:value={formState.name}
				required
				placeholder="ABC Catering Services"
				class="col-span-full"
			/>

			<TextField
				id="serviceType"
				label="Service Type"
				bind:value={formState.serviceType}
				required
				placeholder="Catering, Photography, Security, AV Equipment"
			/>

			<TextField
				id="companyName"
				label="Company Name"
				bind:value={formState.companyName}
				placeholder="ABC Corporation Ltd"
			/>

			<TextField
				id="email"
				label="Email"
				type="email"
				bind:value={formState.email}
				placeholder="contact@example.com"
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

	<!-- Service Details -->
	<FormSection title="Service Details">
		<div class="grid gap-4 grid-cols-1">
			<div>
				<label for="typicalDeliverables" class="block text-sm font-medium text-foreground mb-2">
					Typical Deliverables
				</label>
				<div class="space-y-2">
					<div class="flex gap-2">
						<input
							id="typicalDeliverables"
							type="text"
							bind:value={formState.newDeliverable}
							onkeydown={(e) => {
								if (e.key === 'Enter') {
									e.preventDefault();
									formState.addDeliverable();
								}
							}}
							class="flex-1 px-3.5 py-2.5 border border-input rounded-md focus:ring-2 focus:ring-ring focus:border-ring"
							placeholder="e.g., 200 meals, 4 hours coverage"
						/>
						<Button type="button" variant="outline" onclick={() => formState.addDeliverable()}>
							Add
						</Button>
					</div>
					{#if formState.typicalDeliverables.length > 0}
						<div class="flex flex-wrap gap-2">
							{#each formState.typicalDeliverables as deliverable, index (index)}
								<span
									class="inline-flex items-center gap-1 px-3 py-1 bg-primary/5 text-primary rounded-md text-sm"
								>
									{deliverable}
									<Button
										type="button"
										variant="ghost"
										size="sm"
										class="ml-1 h-auto p-0 text-primary/60 hover:text-primary"
										onclick={() => formState.removeDeliverable(index)}
									>
										&times;
									</Button>
								</span>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<div>
				<label for="equipmentProvided" class="block text-sm font-medium text-foreground mb-2">
					Equipment Provided
				</label>
				<div class="space-y-2">
					<div class="flex gap-2">
						<input
							id="equipmentProvided"
							type="text"
							bind:value={formState.newEquipment}
							onkeydown={(e) => {
								if (e.key === 'Enter') {
									e.preventDefault();
									formState.addEquipment();
								}
							}}
							class="flex-1 px-3.5 py-2.5 border border-input rounded-md focus:ring-2 focus:ring-ring focus:border-ring"
							placeholder="e.g., Cameras, Lighting rig"
						/>
						<Button type="button" variant="outline" onclick={() => formState.addEquipment()}>
							Add
						</Button>
					</div>
					{#if formState.equipmentProvided.length > 0}
						<div class="flex flex-wrap gap-2">
							{#each formState.equipmentProvided as equipment, index (index)}
								<span
									class="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-md text-sm"
								>
									{equipment}
									<Button
										type="button"
										variant="ghost"
										size="sm"
										class="ml-1 h-auto p-0 text-emerald-500 hover:text-emerald-700"
										onclick={() => formState.removeEquipment(index)}
									>
										&times;
									</Button>
								</span>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>
	</FormSection>

	<!-- Business Information -->
	<FormSection title="Business Information">
		<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
			<TextField
				id="businessLicense"
				label="Business License"
				bind:value={formState.businessLicense}
				placeholder="License number"
			/>

			<TextField
				id="insuranceInfo"
				label="Insurance Information"
				bind:value={formState.insuranceInfo}
				placeholder="Insurance details"
			/>
		</div>
	</FormSection>

	<!-- Tax & Banking -->
	<FormSection title="Tax & Banking">
		<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
			<TextField
				id="taxId"
				label="Tax ID"
				bind:value={formState.taxId}
				placeholder="Tax identification number"
			/>

			<TextField
				id="idDocument"
				label="ID Document Number"
				bind:value={formState.idDocument}
				placeholder="Passport/ID number"
			/>

			<BankNameCombobox id="bankName" label="Bank Name" bind:value={formState.bankName} />

			<TextField
				id="bankAccountNumber"
				label="Bank Account Number"
				bind:value={formState.bankAccountNumber}
				placeholder="1234567890"
			/>
		</div>
	</FormSection>

	<!-- ID Documents -->
	<FormSection title="ID Documents">
		<p class="text-sm text-muted-foreground mb-4">
			Upload images of ID/passport documents for validation. You can upload up to 5 documents.
		</p>

		{#if !counterpartyId}
			<div class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
				Please fill in the basic information first to enable document uploads.
			</div>
		{:else}
			<div class="space-y-4">
				{#each [1, 2, 3, 4, 5] as imageNum}
					{@const imageNumber = imageNum as 1 | 2 | 3 | 4 | 5}
					{@const document = formState.getDocument(imageNumber)}
					{@const isUploading = formState.isUploading(imageNumber)}
					<FileUpload
						label={`Document ${imageNumber}`}
						{document}
						onFileSelect={(file) => handleFileUpload(file, imageNumber)}
						onFileDelete={() => handleFileDelete(imageNumber)}
						uploading={isUploading}
						disabled={formState.isSubmitting}
					/>
				{/each}
			</div>
		{/if}
	</FormSection>

	<!-- Notes -->
	<FormSection title="Notes">
		<TextareaField
			id="notes"
			label=""
			bind:value={formState.notes}
			rows={4}
			placeholder="Additional notes about this service provider..."
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
			{formState.isSubmitting
				? 'Saving...'
				: serviceProvider
					? 'Update Service Provider'
					: 'Create Service Provider'}
		</Button>
	</div>
</form>
