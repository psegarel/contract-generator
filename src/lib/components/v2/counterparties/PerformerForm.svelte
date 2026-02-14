<script lang="ts">
	import type { PerformerContractor } from '$lib/types/v2';
	import {
		performerContractorSchema,
		type PerformerContractorInput
	} from '$lib/schemas/v2';
	import { saveCounterparty, updateCounterparty } from '$lib/utils/v2';
	import { authState } from '$lib/state/auth.svelte';
	import { PerformerFormState } from '$lib/state/v2/performerFormState.svelte';
	import { onMount } from 'svelte';
	import { Timestamp } from 'firebase/firestore';
	import { Button } from '$lib/components/ui/button';
	import { logger } from '$lib/utils/logger';

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

<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-6">
	{#if formState.error}
		<div class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
			{formState.error}
		</div>
	{/if}

	<!-- Basic Information -->
	<div class="bg-white p-6 rounded-lg border border-gray-200">
		<h3 class="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
		<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
			<div>
				<label for="name" class="block text-sm font-medium text-gray-700 mb-1">
					Legal Name <span class="text-red-500">*</span>
				</label>
				<input
					id="name"
					type="text"
					bind:value={formState.name}
					required
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
					placeholder="Full legal name"
				/>
			</div>

			<div>
				<label for="stageName" class="block text-sm font-medium text-gray-700 mb-1">
					Stage Name <span class="text-red-500">*</span>
				</label>
				<input
					id="stageName"
					type="text"
					bind:value={formState.stageName}
					required
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
					placeholder="DJ Name / Artist Name"
				/>
			</div>

			<div>
				<label for="performerType" class="block text-sm font-medium text-gray-700 mb-1">
					Performer Type <span class="text-red-500">*</span>
				</label>
				<input
					id="performerType"
					type="text"
					bind:value={formState.performerType}
					required
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
					placeholder="DJ, Band, MC, Dancer, etc."
				/>
			</div>

			<div>
				<label for="genre" class="block text-sm font-medium text-gray-700 mb-1">
					Genre
				</label>
				<input
					id="genre"
					type="text"
					bind:value={formState.genre}
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
					placeholder="House, Techno, Hip-Hop, etc."
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
					placeholder="performer@example.com"
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

	<!-- Performance Requirements -->
	<div class="bg-white p-6 rounded-lg border border-gray-200">
		<h3 class="text-lg font-semibold text-gray-900 mb-4">Performance Requirements</h3>
		<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
			<div class="col-span-full">
				<label for="technicalRider" class="block text-sm font-medium text-gray-700 mb-1">
					Technical Rider
				</label>
				<textarea
					id="technicalRider"
					bind:value={formState.technicalRider}
					rows="3"
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
					placeholder="Equipment and setup requirements..."
				></textarea>
			</div>

			<div>
				<label for="minPerformanceDuration" class="block text-sm font-medium text-gray-700 mb-1">
					Min Performance Duration (minutes)
				</label>
				<input
					id="minPerformanceDuration"
					type="number"
					bind:value={formState.minPerformanceDuration}
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
					placeholder="120"
				/>
			</div>

			<div>
				<label for="travelRequirements" class="block text-sm font-medium text-gray-700 mb-1">
					Travel Requirements
				</label>
				<input
					id="travelRequirements"
					type="text"
					bind:value={formState.travelRequirements}
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
					placeholder="Flight + hotel, local only, etc."
				/>
			</div>
		</div>
	</div>

	<!-- Booking Details -->
	<div class="bg-white p-6 rounded-lg border border-gray-200">
		<h3 class="text-lg font-semibold text-gray-900 mb-4">Booking Details</h3>
		<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
			<div>
				<label for="agentName" class="block text-sm font-medium text-gray-700 mb-1">
					Agent Name
				</label>
				<input
					id="agentName"
					type="text"
					bind:value={formState.agentName}
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
					placeholder="Booking agent name"
				/>
			</div>

			<div>
				<label for="agentContact" class="block text-sm font-medium text-gray-700 mb-1">
					Agent Contact
				</label>
				<input
					id="agentContact"
					type="text"
					bind:value={formState.agentContact}
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
					placeholder="Email or phone"
				/>
			</div>
		</div>
	</div>

	<!-- Payment Details -->
	<div class="bg-white p-6 rounded-lg border border-gray-200">
		<h3 class="text-lg font-semibold text-gray-900 mb-4">Payment Details</h3>
		<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
			<div>
				<label for="bankName" class="block text-sm font-medium text-gray-700 mb-1">
					Bank Name
				</label>
				<input
					id="bankName"
					type="text"
					bind:value={formState.bankName}
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
					placeholder="Vietcombank"
				/>
			</div>

			<div>
				<label for="bankAccountNumber" class="block text-sm font-medium text-gray-700 mb-1">
					Bank Account Number
				</label>
				<input
					id="bankAccountNumber"
					type="text"
					bind:value={formState.bankAccountNumber}
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
					placeholder="1234567890"
				/>
			</div>

			<div>
				<label for="idDocument" class="block text-sm font-medium text-gray-700 mb-1">
					ID Document (Passport/ID Number)
				</label>
				<input
					id="idDocument"
					type="text"
					bind:value={formState.idDocument}
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
					placeholder="123456789"
				/>
			</div>

			<div>
				<label for="taxId" class="block text-sm font-medium text-gray-700 mb-1">
					Tax ID
				</label>
				<input
					id="taxId"
					type="text"
					bind:value={formState.taxId}
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
					placeholder="Tax identification number"
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
			placeholder="Additional notes about this performer..."
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
			{formState.isSubmitting ? 'Saving...' : performer ? 'Update Performer' : 'Create Performer'}
		</Button>
	</div>
</form>
