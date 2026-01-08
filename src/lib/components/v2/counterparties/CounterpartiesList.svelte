<script lang="ts">
	import type { Counterparty } from '$lib/types/v2';
	import CounterpartyListItem from './CounterpartyListItem.svelte';
	import { Building2 } from 'lucide-svelte';

	interface Props {
		counterparties: Counterparty[];
		title?: string;
		showHeaders?: boolean;
		getTypeLabel: (type: Counterparty['type']) => string;
	}

	let { counterparties, title = 'Counterparties', showHeaders = true, getTypeLabel }: Props = $props();
</script>

<div class="border-t border-border h-full flex flex-col">
	<!-- Header -->
	{#if title}
		<div class="flex items-center justify-between py-6 flex-shrink-0">
			<div>
				<h2 class="text-lg font-bold tracking-tight text-foreground">{title}</h2>
				<p class="text-sm text-muted-foreground mt-1">
					{counterparties.length}
					{counterparties.length === 1 ? 'counterparty' : 'counterparties'}
				</p>
			</div>
		</div>
	{/if}

	<!-- Content -->
	{#if counterparties.length === 0}
		<div class="py-12 text-center text-muted-foreground">
			<Building2 class="h-12 w-12 mx-auto mb-3 opacity-50" />
			<p class="text-sm font-medium mb-1">No counterparties yet</p>
			<p class="text-xs">Create your first counterparty to see it here</p>
		</div>
	{:else}
		<!-- Desktop Grid View: Scrolling container -->
		<div class="hidden xl:block flex-1 min-h-0 overflow-y-auto">
			<!-- Column Headers (Desktop only) -->
			{#if showHeaders}
				<div class="grid grid-cols-16 gap-3 items-center bg-slate-200 px-4">
					<div class="col-span-4 text-sm font-semibold px-3 py-3 border-r border-white">Name</div>
					<div class="col-span-4 text-sm font-semibold px-3 py-3 border-r border-white">Email</div>
					<div class="col-span-3 text-sm font-semibold px-3 py-3 border-r border-white">Phone</div>
					<div class="col-span-2 text-sm font-semibold px-3 py-3 text-center border-r border-white">
						Type
					</div>
					<div class="col-span-3 text-sm font-semibold px-3 py-3 text-center">Actions</div>
				</div>
			{/if}

			<!-- Desktop Grid List -->
			<div>
				{#each counterparties as counterparty, index (counterparty.id)}
					<CounterpartyListItem {counterparty} {index} {getTypeLabel} />
				{/each}
			</div>
		</div>

		<!-- Tablet & Mobile: Full page scroll (no scrolling container) -->
		<div class="xl:hidden">
			<!-- Tablet: 2-column card grid -->
			<div class="hidden md:grid grid-cols-2 gap-4 pb-4">
				{#each counterparties as counterparty, index (counterparty.id)}
					<CounterpartyListItem {counterparty} {index} {getTypeLabel} />
				{/each}
			</div>
			<!-- Mobile: Single column -->
			<div class="md:hidden">
				{#each counterparties as counterparty, index (counterparty.id)}
					<CounterpartyListItem {counterparty} {index} {getTypeLabel} />
				{/each}
			</div>
		</div>
	{/if}
</div>


