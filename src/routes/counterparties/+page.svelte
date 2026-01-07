<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select';
	import { Building2, Plus } from 'lucide-svelte';
	import CounterpartiesList from '$lib/components/v2/counterparties/CounterpartiesList.svelte';

	let { data }: { data: PageData } = $props();

	// Group counterparties by type
	let groupedCounterparties = $derived({
		venue: data.counterparties.filter((c) => c.type === 'venue'),
		performer: data.counterparties.filter((c) => c.type === 'performer'),
		'service-provider': data.counterparties.filter((c) => c.type === 'service-provider'),
		client: data.counterparties.filter((c) => c.type === 'client'),
		supplier: data.counterparties.filter((c) => c.type === 'supplier')
	});

	let selectedType = $state<string | 'all'>('all');

	let filteredCounterparties = $derived(
		selectedType === 'all'
			? data.counterparties
			: data.counterparties.filter((c) => c.type === selectedType)
	);

	/**
	 * Get a human-readable label for the counterparty type
	 */
	function getTypeLabel(
		type: 'venue' | 'performer' | 'service-provider' | 'client' | 'supplier'
	): string {
		const labels = {
			venue: 'Venue',
			performer: 'Performer',
			'service-provider': 'Service Provider',
			client: 'Client',
			supplier: 'Supplier'
		} as const;
		return labels[type];
	}
</script>

<div class="py-8">
	<!-- Header -->
	<div class="flex items-center justify-between mb-8">
		<div class="flex items-center gap-3">
			<div
				class="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary"
			>
				<Building2 class="w-6 h-6" />
			</div>
			<div>
				<h1 class="text-3xl font-bold tracking-tight text-foreground">Counterparties</h1>
				<p class="text-muted-foreground mt-1 text-sm">
					{data.counterparties.length}
					{data.counterparties.length === 1 ? 'counterparty' : 'counterparties'}
				</p>
			</div>
		</div>
		<Button href="/counterparties/new">
			<Plus class="w-4 h-4 mr-2" />
			New Counterparty
		</Button>
	</div>

	<!-- Type Filter (Neutral Select) -->
	<div class="mb-6">
		<div class="flex items-center gap-3">
			<span class="text-sm text-muted-foreground">Type</span>
			<Select type="single" bind:value={selectedType}>
				<SelectTrigger class="min-w-48">
					<span data-slot="select-value">
						{selectedType === 'all' ? 'All types' : getTypeLabel(selectedType as any)}
					</span>
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">All ({data.counterparties.length})</SelectItem>
					<SelectItem value="venue">Venues ({groupedCounterparties.venue.length})</SelectItem>
					<SelectItem value="performer"
						>Performers ({groupedCounterparties.performer.length})</SelectItem
					>
					<SelectItem value="service-provider"
						>Service Providers ({groupedCounterparties['service-provider'].length})</SelectItem
					>
					<SelectItem value="client">Clients ({groupedCounterparties.client.length})</SelectItem>
					<SelectItem value="supplier"
						>Suppliers ({groupedCounterparties.supplier.length})</SelectItem
					>
				</SelectContent>
			</Select>
		</div>
	</div>

	<!-- Counterparties List -->
	{#if filteredCounterparties.length === 0}
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
				<Button href="/counterparties/new">
					<Plus class="w-4 h-4 mr-2" />
					Create Counterparty
				</Button>
			{/if}
		</div>
	{:else}
		<CounterpartiesList
			counterparties={filteredCounterparties}
			title=""
			showHeaders={true}
			{getTypeLabel}
		/>
	{/if}
</div>
