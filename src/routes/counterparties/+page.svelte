<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select';
	import { Building2, Plus } from '@lucide/svelte';
	import CounterpartiesList from '$lib/components/v2/counterparties/CounterpartiesList.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';

	let { data }: { data: PageData } = $props();

	// Group counterparties by type/subtype
	let groupedCounterparties = $derived({
		client: data.counterparties.filter((c) => c.type === 'client'),
		performer: data.counterparties.filter(
			(c) => c.type === 'contractor' && 'contractorType' in c && c.contractorType === 'performer'
		),
		'service-provider': data.counterparties.filter(
			(c) =>
				c.type === 'contractor' && 'contractorType' in c && c.contractorType === 'service-provider'
		)
	});

	let selectedType = $state<string | 'all'>('all');

	let filteredCounterparties = $derived(() => {
		if (selectedType === 'all') return data.counterparties;
		if (selectedType === 'client') return groupedCounterparties.client;
		if (selectedType === 'performer') return groupedCounterparties.performer;
		if (selectedType === 'service-provider') return groupedCounterparties['service-provider'];
		return data.counterparties;
	});

	function getSubtypeLabel(counterparty: (typeof data.counterparties)[number]): string {
		if (counterparty.type === 'client') return 'Client';
		if (counterparty.type === 'contractor' && 'contractorType' in counterparty) {
			if (counterparty.contractorType === 'performer') return 'Performer';
			if (counterparty.contractorType === 'service-provider') return 'Service Provider';
		}
		return 'Unknown';
	}
</script>

<div class="flex h-full flex-col">
	<PageHeader
		title="Counterparties"
		description={`${data.counterparties.length} ${data.counterparties.length === 1 ? 'counterparty' : 'counterparties'}`}
	>
		{#snippet icon()}
			<Building2 class="size-5" />
		{/snippet}
		<Button href="/counterparties/new/client" variant="outline">
			<Plus class="size-4" />
			New Client
		</Button>
		<Button href="/counterparties/new/contractor">
			<Plus class="size-4" />
			New Contractor
		</Button>
	</PageHeader>

	<!-- Type Filter -->
	<div class="mb-6 shrink-0">
		<div class="flex items-center gap-3">
			<span class="text-sm text-muted-foreground">Type</span>
			<Select type="single" bind:value={selectedType}>
				<SelectTrigger class="min-w-48">
					<span data-slot="select-value">
						{#if selectedType === 'all'}
							All types
						{:else if selectedType === 'client'}
							Clients
						{:else if selectedType === 'performer'}
							Performers
						{:else if selectedType === 'service-provider'}
							Service Providers
						{/if}
					</span>
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">All ({data.counterparties.length})</SelectItem>
					<SelectItem value="client">Clients ({groupedCounterparties.client.length})</SelectItem>
					<SelectItem value="performer"
						>Performers ({groupedCounterparties.performer.length})</SelectItem
					>
					<SelectItem value="service-provider"
						>Service Providers ({groupedCounterparties['service-provider'].length})</SelectItem
					>
				</SelectContent>
			</Select>
		</div>
	</div>

	<!-- Counterparties List -->
	<div class="flex-1 min-h-0">
		{#if filteredCounterparties().length === 0}
			<div class="py-20 text-center text-muted-foreground">
				<Building2 class="h-16 w-16 mx-auto mb-4 opacity-50" />
				<h3 class="text-lg font-semibold mb-2">
					{selectedType === 'all' ? 'No counterparties yet' : `No ${selectedType}s yet`}
				</h3>
				<p class="text-sm mb-6">
					{selectedType === 'all'
						? 'Create your first counterparty to get started'
						: 'Try selecting a different type or create a new counterparty'}
				</p>
				{#if selectedType === 'all'}
					<Button href="/counterparties/new/client">
						<Plus class="w-4 h-4 mr-2" />
						Create Counterparty
					</Button>
				{/if}
			</div>
		{:else}
			<CounterpartiesList
				counterparties={filteredCounterparties()}
				title=""
				showHeaders={true}
				getTypeLabel={getSubtypeLabel}
			/>
		{/if}
	</div>
</div>
