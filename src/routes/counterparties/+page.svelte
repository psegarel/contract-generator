<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select';
	import { Building2, Plus } from 'lucide-svelte';

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

<div class="p-8">
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
		<Button href="/v2/counterparties/new">
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
				<Button href="/v2/counterparties/new">
					<Plus class="w-4 h-4 mr-2" />
					Create Counterparty
				</Button>
			{/if}
		</div>
	{:else}
		<div class="border-t border-border">
			<!-- Column Headers (Desktop only) -->
			<div class="hidden md:grid grid-cols-16 gap-3 items-center bg-slate-200 px-4">
				<div class="col-span-5 text-sm font-semibold px-3 py-3 border-r border-white">Name</div>
				<div class="col-span-4 text-sm font-semibold px-3 py-3 border-r border-white">Email</div>
				<div class="col-span-3 text-sm font-semibold px-3 py-3 border-r border-white">Phone</div>
				<div class="col-span-2 text-sm font-semibold px-3 py-3 text-center border-r border-white">
					Type
				</div>
				<div class="col-span-2 text-sm font-semibold px-3 py-3 text-center">Actions</div>
			</div>

			<!-- List Items -->
			{#each filteredCounterparties as counterparty (counterparty.id)}
				<!-- Desktop row -->
				<div class="hidden md:grid grid-cols-16 gap-3 items-center px-4 border-b">
					<div class="col-span-5 px-3 py-3">
						<div class="text-sm font-medium text-foreground">{counterparty.name}</div>
						{#if counterparty.address}
							<div class="text-xs text-muted-foreground">{counterparty.address}</div>
						{/if}
					</div>
					<div class="col-span-4 px-3 py-3">
						{#if counterparty.email}
							<a href={`mailto:${counterparty.email}`} class="text-sm hover:text-primary"
								>{counterparty.email}</a
							>
						{:else}
							<span class="text-xs text-muted-foreground">—</span>
						{/if}
					</div>
					<div class="col-span-3 px-3 py-3">
						{#if counterparty.phone}
							<a href={`tel:${counterparty.phone}`} class="text-sm hover:text-primary"
								>{counterparty.phone}</a
							>
						{:else}
							<span class="text-xs text-muted-foreground">—</span>
						{/if}
					</div>
					<div class="col-span-2 px-3 py-3 text-center">
						<span class="text-xs font-semibold">{getTypeLabel(counterparty.type)}</span>
					</div>
					<div class="col-span-2 px-3 py-3 flex justify-center gap-2">
						<Button size="sm" href={`/v2/counterparties/${counterparty.id}`} class="px-2"
							>View</Button
						>
						<Button
							size="sm"
							variant="outline"
							href={`/v2/counterparties/${counterparty.id}/contracts`}
							class="px-2"
						>
							Contracts
						</Button>
					</div>
				</div>

				<!-- Mobile stacked item -->
				<div class="md:hidden border-b px-4 py-3">
					<div class="flex items-center justify-between mb-1">
						<div class="text-sm font-medium text-foreground">{counterparty.name}</div>
						<span class="text-xs">{getTypeLabel(counterparty.type)}</span>
					</div>
					{#if counterparty.address}
						<div class="text-xs text-muted-foreground mb-1">{counterparty.address}</div>
					{/if}
					<div class="flex items-center gap-3 text-sm">
						{#if counterparty.email}
							<a href={`mailto:${counterparty.email}`} class="hover:text-primary"
								>{counterparty.email}</a
							>
						{/if}
						{#if counterparty.phone}
							<a href={`tel:${counterparty.phone}`} class="hover:text-primary"
								>{counterparty.phone}</a
							>
						{/if}
					</div>
					<div class="flex gap-2 mt-3">
						<Button size="sm" href={`/v2/counterparties/${counterparty.id}`} class="px-2 flex-1"
							>View</Button
						>
						<Button
							size="sm"
							variant="outline"
							href={`/v2/counterparties/${counterparty.id}/contracts`}
							class="px-2 flex-1"
						>
							Contracts
						</Button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
