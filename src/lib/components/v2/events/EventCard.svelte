<script lang="ts">
	import type { Event } from '$lib/types/v2';
	import { formatDateString, formatCurrency } from '$lib/utils/formatting';
	import { Calendar, MapPin, TrendingUp, TrendingDown, DollarSign } from 'lucide-svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';

	interface Props {
		event: Event;
	}

	let { event }: Props = $props();

	function getStatusBadge(status: Event['status']) {
		const badges = {
			'planning': { variant: 'default' as const, label: 'Planning', class: 'bg-blue-500' },
			'confirmed': { variant: 'default' as const, label: 'Confirmed', class: 'bg-cyan-500' },
			'in-progress': { variant: 'default' as const, label: 'In Progress', class: 'bg-amber-500' },
			'completed': { variant: 'default' as const, label: 'Completed', class: 'bg-emerald-500' },
			'cancelled': { variant: 'secondary' as const, label: 'Cancelled', class: '' }
		};
		return badges[status];
	}

	let statusBadge = $derived(getStatusBadge(event.status));
	let netRevenueIsPositive = $derived(event.netRevenue >= 0);
</script>

<Card.Root class="hover:shadow-md transition-shadow">
	<Card.Header>
		<div class="flex items-start justify-between gap-4">
			<div class="flex-1">
				<Card.Title class="text-xl mb-2">{event.name}</Card.Title>
				{#if event.eventType}
					<Card.Description>{event.eventType}</Card.Description>
				{/if}
			</div>
			<Badge {...statusBadge}>{statusBadge.label}</Badge>
		</div>
	</Card.Header>

	<Card.Content class="space-y-4">
		<!-- Event Details -->
		<div class="space-y-2 text-sm">
			<div class="flex items-center gap-2.5 text-muted-foreground">
				<Calendar class="h-4 w-4 shrink-0" />
				<span class="tracking-wide">{formatDateString(event.eventDate)}</span>
			</div>
			<div class="flex items-center gap-2.5 text-muted-foreground">
				<MapPin class="h-4 w-4 shrink-0" />
				<span class="truncate">{event.locationAddress}</span>
			</div>
		</div>

		<!-- Financial Summary -->
		<div class="grid grid-cols-3 gap-3 pt-2 border-t">
			<div class="text-center">
				<div class="text-xs text-muted-foreground mb-1">Receivable</div>
				<div class="text-sm font-bold text-emerald-600">
					{formatCurrency(event.totalReceivable)}
				</div>
			</div>
			<div class="text-center">
				<div class="text-xs text-muted-foreground mb-1">Payable</div>
				<div class="text-sm font-bold text-red-600">
					{formatCurrency(event.totalPayable)}
				</div>
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
				<div class="text-sm font-bold {netRevenueIsPositive ? 'text-emerald-600' : 'text-red-600'}">
					{formatCurrency(event.netRevenue)}
				</div>
			</div>
		</div>

		<!-- Contracts Count -->
		{#if event.contractIds.length > 0}
			<div class="text-xs text-muted-foreground flex items-center gap-1.5">
				<DollarSign class="h-3.5 w-3.5" />
				{event.contractIds.length} {event.contractIds.length === 1 ? 'contract' : 'contracts'}
			</div>
		{/if}
	</Card.Content>

	<Card.Footer>
		<Button size="sm" href={`/v2/events/${event.id}`} class="w-full">View Details</Button>
	</Card.Footer>
</Card.Root>
