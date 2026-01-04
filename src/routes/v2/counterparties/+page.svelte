<script lang="ts">
	import type { PageData } from './$types';
	import { CounterpartyCard } from '$lib/components/v2';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
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

	<!-- Type Filters -->
	<div class="flex flex-wrap gap-2 mb-6">
		<Badge
			variant={selectedType === 'all' ? 'default' : 'outline'}
			class="cursor-pointer"
			onclick={() => (selectedType = 'all')}
		>
			All ({data.counterparties.length})
		</Badge>
		<Badge
			variant={selectedType === 'venue' ? 'default' : 'outline'}
			class="cursor-pointer bg-purple-500 hover:bg-purple-600"
			onclick={() => (selectedType = 'venue')}
		>
			Venues ({groupedCounterparties.venue.length})
		</Badge>
		<Badge
			variant={selectedType === 'performer' ? 'default' : 'outline'}
			class="cursor-pointer bg-pink-500 hover:bg-pink-600"
			onclick={() => (selectedType = 'performer')}
		>
			Performers ({groupedCounterparties.performer.length})
		</Badge>
		<Badge
			variant={selectedType === 'service-provider' ? 'default' : 'outline'}
			class="cursor-pointer bg-blue-500 hover:bg-blue-600"
			onclick={() => (selectedType = 'service-provider')}
		>
			Service Providers ({groupedCounterparties['service-provider'].length})
		</Badge>
		<Badge
			variant={selectedType === 'client' ? 'default' : 'outline'}
			class="cursor-pointer bg-emerald-500 hover:bg-emerald-600"
			onclick={() => (selectedType = 'client')}
		>
			Clients ({groupedCounterparties.client.length})
		</Badge>
		<Badge
			variant={selectedType === 'supplier' ? 'default' : 'outline'}
			class="cursor-pointer bg-amber-500 hover:bg-amber-600"
			onclick={() => (selectedType = 'supplier')}
		>
			Suppliers ({groupedCounterparties.supplier.length})
		</Badge>
	</div>

	<!-- Counterparties Grid -->
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
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each filteredCounterparties as counterparty (counterparty.id)}
				<CounterpartyCard {counterparty} />
			{/each}
		</div>
	{/if}
</div>
