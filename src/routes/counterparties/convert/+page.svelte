<script lang="ts">
	import type { ServiceProviderCounterparty } from '$lib/types/v2';
	import { counterpartyState } from '$lib/state/v2';
	import { PERFORMER_TYPES } from '$lib/config/counterpartyTypes';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { ArrowLeft } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';
	import { doc, updateDoc, serverTimestamp, deleteField } from 'firebase/firestore';
	import { db } from '$lib/config/firebase';
	import { logger } from '$lib/utils/logger';

	// State
	let selectedId = $state('');
	let stageName = $state('');
	let performerType = $state('');
	let genre = $state('');
	let isConverting = $state(false);
	let dryRunResult = $state<string[] | null>(null);

	// Service-provider-specific fields to remove (not valid on performer schema)
	const FIELDS_TO_REMOVE = [
		'serviceType',
		'companyName',
		'typicalDeliverables',
		'equipmentProvided',
		'businessLicense',
		'insuranceInfo'
	];

	onMount(() => {
		counterpartyState.init();
		return () => counterpartyState.destroy();
	});

	let serviceProviders = $derived(
		counterpartyState.counterparties.filter(
			(c) => c.type === 'service-provider'
		) as ServiceProviderCounterparty[]
	);

	let selected = $derived(serviceProviders.find((sp) => sp.id === selectedId));

	function resetForm() {
		stageName = '';
		performerType = '';
		genre = '';
		dryRunResult = null;
	}

	function handleSelectChange() {
		resetForm();
		if (selected) {
			// Pre-fill stage name from the counterparty name
			stageName = selected.name;
		}
	}

	function buildChangeList(): string[] {
		if (!selected) return [];
		const changes: string[] = [];

		changes.push(`type: "${selected.type}" → "performer"`);
		changes.push(`stageName: (new) → "${stageName}"`);
		changes.push(`performerType: (new) → "${performerType}"`);
		changes.push(`genre: (new) → "${genre || '(null)'}"`)
		changes.push(`technicalRider: (new) → null`);
		changes.push(`minPerformanceDuration: (new) → null`);
		changes.push(`travelRequirements: (new) → null`);
		changes.push(`agentName: (new) → null`);
		changes.push(`agentContact: (new) → null`);

		const data = selected as unknown as Record<string, unknown>;
		for (const field of FIELDS_TO_REMOVE) {
			if (field in data && data[field] !== null && data[field] !== undefined) {
				changes.push(`${field}: "${data[field]}" → (removed)`);
			} else {
				changes.push(`${field}: → (removed)`);
			}
		}

		changes.push(`Preserved: name, email, phone, address, bankName, bankAccountNumber, idDocument, taxId`);

		return changes;
	}

	function handleDryRun() {
		if (!selectedId) {
			toast.error('Please select a service provider');
			return;
		}
		if (!stageName) {
			toast.error('Stage name is required');
			return;
		}
		if (!performerType) {
			toast.error('Performer type is required');
			return;
		}
		dryRunResult = buildChangeList();
	}

	async function handleConvert() {
		if (!selectedId || !selected) {
			toast.error('Please select a service provider');
			return;
		}
		if (!stageName) {
			toast.error('Stage name is required');
			return;
		}
		if (!performerType) {
			toast.error('Performer type is required');
			return;
		}

		const selectedName = selected.name;
		isConverting = true;
		try {
			const docRef = doc(db, 'counterparties', selectedId);

			const updates: Record<string, unknown> = {
				// Set new performer fields
				type: 'performer',
				stageName,
				performerType,
				genre: genre || null,
				technicalRider: null,
				minPerformanceDuration: null,
				travelRequirements: null,
				agentName: null,
				agentContact: null,
				updatedAt: serverTimestamp()
			};

			// Remove service-provider-specific fields
			for (const field of FIELDS_TO_REMOVE) {
				updates[field] = deleteField();
			}

			await updateDoc(docRef, updates);

			toast.success(`Converted "${selectedName}" to performer successfully!`);
			selectedId = '';
			resetForm();
		} catch (err) {
			logger.error('Error converting counterparty:', err);
			toast.error('Failed to convert counterparty');
		} finally {
			isConverting = false;
		}
	}
</script>

<div class="p-8">
	<!-- Header -->
	<div class="flex items-center gap-3 mb-8">
		<Button variant="ghost" size="sm" href="/counterparties">
			<ArrowLeft class="w-4 h-4 mr-2" />
			Back
		</Button>
		<div>
			<h1 class="text-3xl font-bold tracking-tight text-foreground">
				Convert Counterparty Type
			</h1>
			<p class="text-muted-foreground mt-1 text-sm">
				Convert a service provider to a performer counterparty
			</p>
		</div>
	</div>

	<!-- Step 1: Select Service Provider -->
	<div class="bg-white p-6 rounded-lg border border-gray-200 mb-6">
		<h3 class="text-lg font-semibold text-gray-900 mb-4">1. Select Service Provider</h3>

		{#if counterpartyState.isLoading}
			<p class="text-gray-500">Loading counterparties...</p>
		{:else if serviceProviders.length === 0}
			<p class="text-gray-500">No service-provider counterparties found.</p>
		{:else}
			<select
				bind:value={selectedId}
				onchange={handleSelectChange}
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
			>
				<option value="">Select a service provider to convert...</option>
				{#each serviceProviders as sp (sp.id)}
					<option value={sp.id}>{sp.name} — {sp.serviceType || 'No service type'}</option>
				{/each}
			</select>
		{/if}

		{#if selected}
			<div class="mt-4 p-4 bg-gray-50 rounded-lg text-sm space-y-1">
				<p><strong>Name:</strong> {selected.name}</p>
				<p><strong>Service Type:</strong> {selected.serviceType || '—'}</p>
				<p><strong>Email:</strong> {selected.email || '—'}</p>
				<p><strong>Phone:</strong> {selected.phone || '—'}</p>
				<p>
					<strong>Type:</strong>
					<Badge variant="default" class="bg-blue-500 ml-1">Service Provider</Badge>
					→
					<Badge variant="default" class="bg-pink-500">Performer</Badge>
				</p>
			</div>
		{/if}
	</div>

	<!-- Step 2: Performer Details -->
	{#if selected}
		<div class="bg-white p-6 rounded-lg border border-gray-200 mb-6">
			<h3 class="text-lg font-semibold text-gray-900 mb-4">2. Performer Details</h3>
			<div class="grid gap-4 grid-cols-1 md:grid-cols-3">
				<div>
					<label for="stageName" class="block text-sm font-medium text-gray-700 mb-1">
						Stage Name <span class="text-red-500">*</span>
					</label>
					<input
						id="stageName"
						type="text"
						bind:value={stageName}
						class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
						placeholder="e.g., DJ Mai"
					/>
				</div>
				<div>
					<label for="performerType" class="block text-sm font-medium text-gray-700 mb-1">
						Performer Type <span class="text-red-500">*</span>
					</label>
					<select
						id="performerType"
						bind:value={performerType}
						class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
					>
						<option value="">Select type</option>
						{#each PERFORMER_TYPES as type (type)}
							<option value={type}>{type}</option>
						{/each}
					</select>
				</div>
				<div>
					<label for="genre" class="block text-sm font-medium text-gray-700 mb-1">
						Genre
					</label>
					<input
						id="genre"
						type="text"
						bind:value={genre}
						class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
						placeholder="e.g., House, Jazz"
					/>
				</div>
			</div>
		</div>

		<!-- Step 3: Preview & Convert -->
		<div class="bg-white p-6 rounded-lg border border-gray-200 mb-6">
			<h3 class="text-lg font-semibold text-gray-900 mb-4">3. Preview & Convert</h3>

			<div class="flex gap-3 mb-4">
				<Button variant="outline" onclick={handleDryRun}>
					Preview Changes
				</Button>
				<Button
					variant="dark"
					onclick={handleConvert}
					disabled={isConverting || !stageName || !performerType}
				>
					{isConverting ? 'Converting...' : 'Convert to Performer'}
				</Button>
			</div>

			{#if dryRunResult}
				<div class="p-4 bg-amber-50 border border-amber-200 rounded-lg">
					<h4 class="font-medium text-amber-900 mb-2">Changes that will be applied:</h4>
					<ul class="text-sm text-amber-800 space-y-1 font-mono">
						{#each dryRunResult as change, i (i)}
							<li>{change}</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>
	{/if}
</div>
