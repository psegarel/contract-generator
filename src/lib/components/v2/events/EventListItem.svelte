<script lang="ts">
	import type { Event } from '$lib/types/v2';
	import { formatDateString, formatCurrency } from '$lib/utils/formatting';
	import { Calendar, MapPin, TrendingUp, TrendingDown, Pencil } from 'lucide-svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';

	interface Props {
		event: Event;
		index: number;
	}

	let { event, index }: Props = $props();

	function getStatusBadge(status: Event['status']) {
		const badges = {
			planning: { variant: 'default' as const, label: 'Planning', class: 'bg-blue-500' },
			confirmed: { variant: 'default' as const, label: 'Confirmed', class: 'bg-cyan-500' },
			'in-progress': { variant: 'default' as const, label: 'In Progress', class: 'bg-amber-500' },
			completed: { variant: 'default' as const, label: 'Completed', class: 'bg-emerald-500' },
			cancelled: { variant: 'secondary' as const, label: 'Cancelled', class: '' }
		};
		return badges[status];
	}

	let statusBadge = $derived(getStatusBadge(event.status));
	let netRevenueIsPositive = $derived(event.netRevenue >= 0);
</script>

<div class={index % 2 === 0 ? 'bg-white' : 'bg-slate-100/80'}>
	<!-- Mobile: Stacked Layout -->
	<div class="md:hidden space-y-4 py-3 px-4">
		<!-- Title and Status Badge -->
		<div class="flex items-start justify-between gap-3">
			<h3 class="text-xl font-bold leading-tight flex-1 tracking-tight">{event.name}</h3>
			<Badge {...statusBadge} class={statusBadge.class}>{statusBadge.label}</Badge>
		</div>

		<!-- Details -->
		<div class="space-y-2 text-sm text-muted-foreground">
			<div class="flex items-center gap-2.5">
				<Calendar class="h-4 w-4 shrink-0" />
				<span class="tracking-wide">{formatDateString(event.eventDate)}</span>
			</div>
			<div class="flex items-center gap-2.5">
				<MapPin class="h-4 w-4 shrink-0" />
				<span class="truncate">{event.locationAddress}</span>
			</div>
			{#if event.eventType}
				<div class="text-xs">{event.eventType}</div>
			{/if}
		</div>

		<!-- Financial Summary -->
		<div class="grid grid-cols-3 gap-3 pt-2 border-t">
			<div class="text-center">
				<div class="text-xs text-muted-foreground mb-1">Receivable</div>
				<div class="text-sm font-bold text-emerald-600">{formatCurrency(event.totalReceivable)}</div>
			</div>
			<div class="text-center">
				<div class="text-xs text-muted-foreground mb-1">Payable</div>
				<div class="text-sm font-bold text-red-600">{formatCurrency(event.totalPayable)}</div>
			</div>
			<div class="text-center">
				<div class="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
					{#if netRevenueIsPositive}
						<TrendingUp class="h-3 w-3" />
					{:else}
						<TrendingDown class="h-3 w-3" />
					{/if}
					Net
				</div>
				<div
					class="text-sm font-bold {netRevenueIsPositive ? 'text-emerald-600' : 'text-red-600'}"
				>
					{formatCurrency(event.netRevenue)}
				</div>
			</div>
		</div>

		<!-- Actions -->
		<div class="pt-2">
			<Button size="sm" href={`/events/${event.id}`} class="w-full">
				<Pencil class="h-3.5 w-3.5 mr-1.5" />
				View
			</Button>
		</div>
	</div>

	<!-- Desktop: Grid Layout (18 columns) -->
	<div class="hidden md:grid grid-cols-18 gap-3 items-center py-3 px-4">
		<!-- Event Name -->
		<div class="col-span-3">
			<h3 class="text-sm font-bold tracking-tight truncate">{event.name}</h3>
			{#if event.eventType}
				<p class="text-xs text-muted-foreground truncate">{event.eventType}</p>
			{/if}
		</div>

		<!-- Event Date -->
		<div class="col-span-2 text-sm text-center tracking-wide">
			{formatDateString(event.eventDate)}
		</div>

		<!-- Location -->
		<div class="col-span-3 text-sm truncate">{event.locationAddress}</div>

		<!-- Status Badge -->
		<div class="col-span-2 flex justify-center">
			<Badge {...statusBadge} class={statusBadge.class}>{statusBadge.label}</Badge>
		</div>

		<!-- Total Receivable -->
		<div
			class="col-span-2 text-sm font-bold text-emerald-600 dark:text-emerald-400 text-right tabular-nums"
		>
			{formatCurrency(event.totalReceivable)}
		</div>

		<!-- Total Payable -->
		<div
			class="col-span-2 text-sm font-bold text-red-600 dark:text-red-400 text-right tabular-nums"
		>
			{formatCurrency(event.totalPayable)}
		</div>

		<!-- Net Revenue -->
		<div
			class="col-span-2 text-sm font-bold {netRevenueIsPositive
				? 'text-emerald-600 dark:text-emerald-400'
				: 'text-red-600 dark:text-red-400'} text-right tabular-nums"
		>
			{formatCurrency(event.netRevenue)}
		</div>

		<!-- Contracts Count -->
		<div class="col-span-1 text-sm text-center text-muted-foreground">
			{event.contractIds.length}
		</div>

		<!-- View Button -->
		<div class="col-span-1 flex justify-center">
			<Button size="sm" href={`/events/${event.id}`} class="px-2" title="View">
				<Pencil class="h-4 w-4" />
			</Button>
		</div>
	</div>
</div>

