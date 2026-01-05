<script lang="ts">
	import type { Event } from '$lib/types/v2';
	import type { BaseContract } from '$lib/types/v2';
	import EventListItem from './EventListItem.svelte';
	import { Calendar } from 'lucide-svelte';
	import {
		serviceProvisionContractState,
		eventPlanningContractState
	} from '$lib/state/v2';

	interface Props {
		events: Event[];
		title?: string;
		showHeaders?: boolean;
	}

	let { events, title = 'Events', showHeaders = true }: Props = $props();

	// Get all contracts
	let allContracts = $derived<BaseContract[]>([
		...serviceProvisionContractState.contracts,
		...eventPlanningContractState.contracts
	]);

	// Calculate financials for each event from its contracts
	function calculateEventFinancials(event: Event) {
		const eventContracts = allContracts.filter((c) => c.eventId === event.id);

		const totalReceivable = eventContracts
			.filter((c) => c.paymentDirection === 'receivable')
			.reduce((sum, c) => sum + c.contractValue, 0);

		const totalPayable = eventContracts
			.filter((c) => c.paymentDirection === 'payable')
			.reduce((sum, c) => sum + c.contractValue, 0);

		const netRevenue = totalReceivable - totalPayable;

		return {
			...event,
			totalReceivable,
			totalPayable,
			netRevenue
		};
	}

	// Enrich events with calculated financials
	let enrichedEvents = $derived(events.map(calculateEventFinancials));
</script>

<div class="border-t border-border">
	<!-- Header -->
	{#if title}
		<div class="flex items-center justify-between py-6">
			<div>
				<h2 class="text-lg font-bold tracking-tight text-foreground">{title}</h2>
				<p class="text-sm text-muted-foreground mt-1">
					{events.length}
					{events.length === 1 ? 'event' : 'events'}
				</p>
			</div>
		</div>
	{/if}

	<!-- Content -->
	{#if events.length === 0}
		<div class="py-12 text-center text-muted-foreground">
			<Calendar class="h-12 w-12 mx-auto mb-3 opacity-50" />
			<p class="text-sm font-medium mb-1">No events yet</p>
			<p class="text-xs">Create your first event to see it here</p>
		</div>
	{:else}
		<div class="max-h-96 overflow-y-auto">
			<!-- Column Headers (Desktop only) -->
			{#if showHeaders}
				<div class="hidden md:grid grid-cols-18 gap-3 items-center bg-slate-200 px-4">
					<div class="col-span-3 text-sm font-semibold px-3 py-3 border-r border-white">
						Event Name
					</div>
					<div class="col-span-2 text-sm font-semibold px-3 py-3 text-center border-r border-white">
						Date
					</div>
					<div class="col-span-3 text-sm font-semibold px-3 py-3 border-r border-white">Location</div>
					<div class="col-span-2 text-sm font-semibold px-3 py-3 text-center border-r border-white">
						Status
					</div>
					<div class="col-span-2 text-sm font-semibold px-3 py-3 text-right border-r border-white">
						Receivable
					</div>
					<div class="col-span-2 text-sm font-semibold px-3 py-3 text-right border-r border-white">
						Payable
					</div>
					<div class="col-span-2 text-sm font-semibold px-3 py-3 text-right border-r border-white">
						Net Revenue
					</div>
					<div class="col-span-1 text-sm font-semibold px-3 py-3 text-center border-r border-white">
						Contracts
					</div>
					<div class="col-span-1 text-sm font-semibold px-3 py-3 text-center">Actions</div>
				</div>
			{/if}

			<!-- Event List -->
			{#each enrichedEvents as event, index (event.id)}
				<EventListItem {event} {index} />
			{/each}
		</div>
	{/if}
</div>

