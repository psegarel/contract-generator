<script lang="ts">
	import TextField from '$lib/components/TextField.svelte';
	import SelectField from '$lib/components/SelectField.svelte';
	import { Button } from '$lib/components/ui/button';
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

<div class="bg-primary/5 p-6 space-y-6">
	<h3 class="text-lg font-semibold text-foreground mb-4">Add New Performer</h3>

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
		<SelectField id="performerType" label="Performer Type" bind:value={performerType} required>
			<option value="">Select type</option>
			{#each PERFORMER_TYPES as type (type)}
				<option value={type}>{type}</option>
			{/each}
		</SelectField>
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
		<TextField id="performerTaxId" label="Tax ID" bind:value={taxId} placeholder="Tax code" />
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

	<div class="flex gap-3 justify-end pt-4">
		<Button type="button" variant="outline" onclick={onCancel}>Cancel</Button>
		<Button type="button" onclick={handleCreate} disabled={isSubmitting}>
			{isSubmitting ? 'Creating...' : 'Create Performer'}
		</Button>
	</div>
</div>
