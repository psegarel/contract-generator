<script lang="ts">
	import TextField from '$lib/components/TextField.svelte';
	import { PERFORMER_TYPES } from '$lib/config/counterpartyTypes';
	import { saveCounterparty } from '$lib/utils/v2/counterparties';
	import { performerContractorSchema } from '$lib/schemas/v2/counterparty';
	import type { PerformerContractorInput } from '$lib/schemas/v2/counterparty';
	import { authState } from '$lib/state/auth.svelte';
	import { companyConfig } from '$lib/config/company';
	import { Timestamp } from 'firebase/firestore';
	import { toast } from 'svelte-sonner';
	import { logger } from '$lib/utils/logger';

	interface Props {
		onCreated: (counterpartyId: string) => void;
		onCancel: () => void;
	}

	let { onCreated, onCancel }: Props = $props();

	let name = $state('');
	let stageName = $state('');
	let performerType = $state('DJ');
	let genre = $state('');
	let email = $state('');
	let phone = $state('');
	let bankName = $state('');
	let bankAccountNumber = $state('');
	let idDocument = $state('');
	let taxId = $state('');
	let pitRate = $state(String(companyConfig.defaultPerformerPitRate));
	let isSubmitting = $state(false);

	async function handleCreate() {
		if (!authState.user) {
			toast.error('You must be logged in to create a performer');
			return;
		}
		if (!name) {
			toast.error('Please enter the performer name');
			return;
		}
		if (!stageName) {
			toast.error('Please enter a stage name');
			return;
		}
		if (!performerType) {
			toast.error('Please enter the performer type');
			return;
		}

		isSubmitting = true;
		try {
			const performerData: PerformerContractorInput = {
				type: 'contractor',
				contractorType: 'performer',
				ownerUid: authState.user.uid,
				name,
				stageName,
				performerType,
				genre: genre || null,
				email: email || null,
				phone: phone || null,
				address: null,
				technicalRider: null,
				minPerformanceDuration: null,
				travelRequirements: null,
				agentName: null,
				agentContact: null,
				bankName: bankName || null,
				bankAccountNumber: bankAccountNumber || null,
				idDocument: idDocument || null,
				taxId: taxId || null,
				pitRate: pitRate ? Number(pitRate) : companyConfig.defaultPerformerPitRate,
				pitRatePolicy: companyConfig.defaultPerformerPitRatePolicy,
				notes: null,
				createdAt: Timestamp.now(),
				updatedAt: Timestamp.now()
			};

			const validationResult = performerContractorSchema.safeParse(performerData);
			if (!validationResult.success) {
				toast.error('Validation error: ' + validationResult.error.issues[0].message);
				return;
			}

			const counterpartyId = await saveCounterparty(performerData);
			toast.success('Performer created successfully!');
			onCreated(counterpartyId);
		} catch (err) {
			logger.error('Error creating performer:', err);
			toast.error('Failed to create performer');
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="bg-blue-50 border border-blue-200 p-6 rounded-lg space-y-6">
	<h3 class="text-lg font-semibold text-gray-900 mb-4">Add New Performer</h3>

	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<TextField
			id="performerName"
			label="Legal Name"
			bind:value={name}
			placeholder="e.g., Nguyen Thi Mai"
			required
		/>
		<TextField
			id="performerStageName"
			label="Stage Name"
			bind:value={stageName}
			placeholder="e.g., DJ Mai"
			required
		/>
		<div>
			<label for="performerType" class="text-sm font-medium text-foreground ml-1">
				Performer Type
				<span class="text-destructive">*</span>
			</label>
			<select
				id="performerType"
				bind:value={performerType}
				class="w-full px-4 py-3 bg-background rounded-2xl text-foreground focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all border-none text-sm mt-2"
			>
				<option value="">Select type</option>
				{#each PERFORMER_TYPES as type (type)}
					<option value={type}>{type}</option>
				{/each}
			</select>
		</div>
		<TextField
			id="performerGenre"
			label="Genre"
			bind:value={genre}
			placeholder="e.g., House, Techno, Hip Hop"
		/>
	</div>

	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<TextField
			id="performerEmail"
			label="Email"
			type="email"
			bind:value={email}
			placeholder="performer@email.com"
		/>
		<TextField
			id="performerPhone"
			label="Phone"
			type="tel"
			bind:value={phone}
			placeholder="+84 xxx xxx xxx"
		/>
	</div>

	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<TextField
			id="performerBankName"
			label="Bank Name"
			bind:value={bankName}
			placeholder="e.g., Vietcombank"
		/>
		<TextField
			id="performerBankAccount"
			label="Account Number"
			bind:value={bankAccountNumber}
			placeholder="Account number"
		/>
		<TextField
			id="performerIdDocument"
			label="ID Document"
			bind:value={idDocument}
			placeholder="Passport / CCCD number"
		/>
		<TextField
			id="performerTaxId"
			label="Tax ID"
			bind:value={taxId}
			placeholder="Tax code"
		/>
		<TextField
			id="performerPitRate"
			label="PIT Rate (%)"
			type="number"
			bind:value={pitRate}
			min="0"
			max="100"
			placeholder="10"
		/>
	</div>

	<div class="flex gap-3 justify-end pt-4 border-t border-blue-300">
		<button
			type="button"
			onclick={onCancel}
			class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
		>
			Cancel
		</button>
		<button
			type="button"
			onclick={handleCreate}
			disabled={isSubmitting}
			class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
		>
			{isSubmitting ? 'Creating...' : 'Create Performer'}
		</button>
	</div>
</div>
