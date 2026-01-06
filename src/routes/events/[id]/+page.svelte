<script lang="ts">
	import type { PageData } from './$types';
	import { ContractsList } from '$lib/components/v2';
	import { formatDateString, formatCurrency } from '$lib/utils/formatting';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as Card from '$lib/components/ui/card';
	import {
		Calendar,
		MapPin,
		TrendingUp,
		TrendingDown,
		DollarSign,
		ArrowLeft,
		Plus
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	function getStatusBadge(status: typeof data.event.status) {
		const badges = {
			planning: { variant: 'default' as const, label: 'Planning', class: 'bg-blue-500' },
			confirmed: { variant: 'default' as const, label: 'Confirmed', class: 'bg-cyan-500' },
			'in-progress': { variant: 'default' as const, label: 'In Progress', class: 'bg-amber-500' },
			completed: { variant: 'default' as const, label: 'Completed', class: 'bg-emerald-500' },
			cancelled: { variant: 'secondary' as const, label: 'Cancelled', class: '' }
		};
		return badges[status];
	}

	// Calculate financials from contracts (don't rely on stored event values)
	let totalReceivable = $derived(
		data.contracts
			.filter((c) => c.paymentDirection === 'receivable')
			.reduce((sum, c) => sum + (c.contractValue || 0), 0)
	);

	let totalPayable = $derived(
		data.contracts
			.filter((c) => c.paymentDirection === 'payable')
			.reduce((sum, c) => sum + (c.contractValue || 0), 0)
	);

	let netRevenue = $derived(totalReceivable - totalPayable);

	let statusBadge = $derived(getStatusBadge(data.event.status));
	let netRevenueIsPositive = $derived(netRevenue >= 0);
</script>

<div class="p-8">
	<!-- Header -->
	<div class="mb-8">
		<Button variant="ghost" href="/events" class="mb-4">
			<ArrowLeft class="w-4 h-4 mr-2" />
			Back to Events
		</Button>

		<div class="flex items-start justify-between">
			<div class="flex-1">
				<h1 class="text-3xl font-bold tracking-tight text-foreground mb-2">
					{data.event.name}
				</h1>
				{#if data.event.eventType}
					<p class="text-muted-foreground text-lg">{data.event.eventType}</p>
				{/if}
			</div>
			<Badge {...statusBadge} class="text-base px-4 py-2">{statusBadge.label}</Badge>
		</div>
	</div>

	<!-- Event Details Grid -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
		<!-- Event Information -->
		<Card.Root class="lg:col-span-2">
			<Card.Header>
				<Card.Title>Event Details</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div class="flex items-center gap-3 text-muted-foreground">
					<Calendar class="h-5 w-5 shrink-0" />
					<div>
						<div class="text-sm font-medium text-foreground">
							{formatDateString(data.event.eventDate)}
						</div>
						{#if data.event.startTime || data.event.endTime}
							<div class="text-xs">
								{data.event.startTime || 'TBD'} - {data.event.endTime || 'TBD'}
							</div>
						{/if}
					</div>
				</div>

				<div class="flex items-start gap-3 text-muted-foreground">
					<MapPin class="h-5 w-5 shrink-0 mt-0.5" />
					<div>
						{#if data.event.locationName}
							<div class="text-sm font-medium text-foreground">{data.event.locationName}</div>
						{/if}
						<div class="text-sm">{data.event.locationAddress}</div>
					</div>
				</div>

				{#if data.event.expectedAttendance}
					<div class="text-sm">
						<span class="text-muted-foreground">Expected Attendance:</span>
						<span class="font-medium ml-2">{data.event.expectedAttendance.toLocaleString()}</span>
					</div>
				{/if}

				{#if data.event.description}
					<div class="pt-4 border-t">
						<div class="text-sm font-medium mb-2">Description</div>
						<p class="text-sm text-muted-foreground">{data.event.description}</p>
					</div>
				{/if}

				{#if data.event.internalNotes}
					<div class="pt-4 border-t">
						<div class="text-sm font-medium mb-2">Internal Notes</div>
						<p class="text-sm text-muted-foreground">{data.event.internalNotes}</p>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>

		<!-- Financial Summary -->
		<Card.Root>
			<Card.Header>
				<Card.Title>Financial Summary</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div>
					<div class="text-xs text-muted-foreground mb-1">Total Receivable</div>
					<div class="text-2xl font-bold text-emerald-600">
						{formatCurrency(totalReceivable)}
					</div>
				</div>

				<div>
					<div class="text-xs text-muted-foreground mb-1">Total Payable</div>
					<div class="text-2xl font-bold text-red-600">
						{formatCurrency(totalPayable)}
					</div>
				</div>

				<div class="pt-4 border-t">
					<div class="text-xs text-muted-foreground mb-1 flex items-center gap-1">
						{#if netRevenueIsPositive}
							<TrendingUp class="h-3.5 w-3.5" />
						{:else}
							<TrendingDown class="h-3.5 w-3.5" />
						{/if}
						Net Revenue
					</div>
					<div
						class="text-2xl font-bold {netRevenueIsPositive ? 'text-emerald-600' : 'text-red-600'}"
					>
						{formatCurrency(netRevenue)}
					</div>
				</div>

				<div class="pt-4 border-t text-sm text-muted-foreground flex items-center gap-2">
					<DollarSign class="h-4 w-4" />
					{data.contracts.length}
					{data.contracts.length === 1 ? 'contract' : 'contracts'}
				</div>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Contracts Section -->
	<Card.Root>
		<Card.Header>
			<div class="flex items-center justify-between">
				<Card.Title>Contracts</Card.Title>
				<Button size="sm" href="/contracts/service-provision?eventId={data.event.id}">
					<Plus class="w-4 h-4 mr-2" />
					Add Contract
				</Button>
			</div>
		</Card.Header>
		<Card.Content class="p-0">
			<ContractsList contracts={data.contracts} title="" showHeaders={true} />
		</Card.Content>
	</Card.Root>
</div>
