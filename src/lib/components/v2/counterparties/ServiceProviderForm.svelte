<script lang="ts">
	import type { ServiceProviderCounterparty } from '$lib/types/v2';
	import {
		serviceProviderCounterpartySchema,
		type ServiceProviderCounterpartyInput
	} from '$lib/schemas/v2';
	import { saveCounterparty, updateCounterparty } from '$lib/utils/v2';
	import { authState } from '$lib/state/auth.svelte';
	import { ServiceProviderFormState } from '$lib/state/v2/serviceProviderFormState.svelte';
	import { onMount } from 'svelte';
	import { Timestamp } from 'firebase/firestore';
	import { Button } from '$lib/components/ui/button';
	import { logger } from '$lib/utils/logger';

	interface Props {
		serviceProvider?: ServiceProviderCounterparty | null;
		onSuccess?: (serviceProviderId: string) => void;
		onCancel?: () => void;
	}

	let { serviceProvider = null, onSuccess, onCancel }: Props = $props();

	// Create form state instance
	const formState = new ServiceProviderFormState();

	// Initialize form state from prop (one-time initialization on mount)
	onMount(() => {
		formState.init(serviceProvider);
	});

	async function handleSubmit() {
		if (!authState.user) {
			formState.error = 'You must be logged in to create a service provider';
			return;
		}

		formState.isSubmitting = true;
		formState.error = null;

		try {
			const serviceProviderData: ServiceProviderCounterpartyInput = {
				type: 'service-provider',
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
				// Timestamps: when creating use Timestamp.now(), when editing preserve createdAt
				createdAt: serviceProvider?.createdAt || Timestamp.now(),
				updatedAt: Timestamp.now()
			};

			// Validate with schema
			const validationResult = serviceProviderCounterpartySchema.safeParse(serviceProviderData);
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

<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-6">
	<!-- Error message -->
	{#if formState.error}
		<div class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
			{formState.error}
		</div>
	{/if}

	<!-- Basic Information -->
	<div class="bg-white p-6 rounded-lg border border-gray-200">
		<h3 class="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
		<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
			<div class="col-span-full">
				<label for="name" class="block text-sm font-medium text-gray-700 mb-1">
					Name <span class="text-red-500">*</span>
				</label>
				<input
					id="name"
					type="text"
					bind:value={formState.name}
					required
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
					placeholder="ABC Catering Services"
				/>
			</div>

			<div>
				<label for="serviceType" class="block text-sm font-medium text-gray-700 mb-1">
					Service Type <span class="text-red-500">*</span>
				</label>
				<input
					id="serviceType"
					type="text"
					bind:value={formState.serviceType}
					required
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
					placeholder="Catering, Photography, Security, AV Equipment"
				/>
			</div>

			<div>
				<label for="companyName" class="block text-sm font-medium text-gray-700 mb-1">
					Company Name
				</label>
				<input
					id="companyName"
					type="text"
					bind:value={formState.companyName}
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
					placeholder="ABC Corporation Ltd"
				/>
			</div>

			<div>
				<label for="email" class="block text-sm font-medium text-gray-700 mb-1">
					Email
				</label>
				<input
					id="email"
					type="email"
					bind:value={formState.email}
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
					placeholder="contact@example.com"
				/>
			</div>

			<div>
				<label for="phone" class="block text-sm font-medium text-gray-700 mb-1">
					Phone
				</label>
				<input
					id="phone"
					type="tel"
					bind:value={formState.phone}
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
					placeholder="+84 123 456 789"
				/>
			</div>

			<div class="col-span-full">
				<label for="address" class="block text-sm font-medium text-gray-700 mb-1">
					Address
				</label>
				<input
					id="address"
					type="text"
					bind:value={formState.address}
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
					placeholder="123 Main St, Ho Chi Minh City"
				/>
			</div>
		</div>
	</div>

	<!-- Service Details -->
	<div class="bg-white p-6 rounded-lg border border-gray-200">
		<h3 class="text-lg font-semibold text-gray-900 mb-4">Service Details</h3>
		<div class="grid gap-4 grid-cols-1">
			<div>
				<label for="typicalDeliverables" class="block text-sm font-medium text-gray-700 mb-2">
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
							class="flex-1 px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
							placeholder="e.g., 200 meals, 4 hours coverage"
						/>
						<button
							type="button"
							onclick={() => formState.addDeliverable()}
							class="px-4 py-2 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
						>
							Add
						</button>
					</div>
					{#if formState.typicalDeliverables.length > 0}
						<div class="flex flex-wrap gap-2">
							{#each formState.typicalDeliverables as deliverable, index (index)}
								<span
									class="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-md text-sm"
								>
									{deliverable}
									<button
										type="button"
										onclick={() => formState.removeDeliverable(index)}
										class="ml-1 text-blue-500 hover:text-blue-700"
									>
										×
									</button>
								</span>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<div>
				<label for="equipmentProvided" class="block text-sm font-medium text-gray-700 mb-2">
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
							class="flex-1 px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
							placeholder="e.g., Cameras, Lighting rig"
						/>
						<button
							type="button"
							onclick={() => formState.addEquipment()}
							class="px-4 py-2 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
						>
							Add
						</button>
					</div>
					{#if formState.equipmentProvided.length > 0}
						<div class="flex flex-wrap gap-2">
							{#each formState.equipmentProvided as equipment, index (index)}
								<span
									class="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-md text-sm"
								>
									{equipment}
									<button
										type="button"
										onclick={() => formState.removeEquipment(index)}
										class="ml-1 text-green-500 hover:text-green-700"
									>
										×
									</button>
								</span>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- Business Information -->
	<div class="bg-white p-6 rounded-lg border border-gray-200">
		<h3 class="text-lg font-semibold text-gray-900 mb-4">Business Information</h3>
		<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
			<div>
				<label for="businessLicense" class="block text-sm font-medium text-gray-700 mb-1">
					Business License
				</label>
				<input
					id="businessLicense"
					type="text"
					bind:value={formState.businessLicense}
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
					placeholder="License number"
				/>
			</div>

			<div>
				<label for="insuranceInfo" class="block text-sm font-medium text-gray-700 mb-1">
					Insurance Information
				</label>
				<input
					id="insuranceInfo"
					type="text"
					bind:value={formState.insuranceInfo}
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
					placeholder="Insurance details"
				/>
			</div>
		</div>
	</div>

	<!-- Notes -->
	<div class="bg-white p-6 rounded-lg border border-gray-200">
		<h3 class="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
		<textarea
			id="notes"
			bind:value={formState.notes}
			rows="4"
			class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
			placeholder="Additional notes about this service provider..."
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
			{formState.isSubmitting ? 'Saving...' : serviceProvider ? 'Update Service Provider' : 'Create Service Provider'}
		</Button>
	</div>
</form>

