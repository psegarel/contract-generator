<script lang="ts">
	import type { UnifiedContract } from '$lib/utils/mergeContracts';
	import { formatDateString, formatCurrency } from '$lib/utils/formatting';
	import { Calendar, MapPin, User, Pencil } from 'lucide-svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';

	interface Props {
		contract: UnifiedContract;
	}

	let { contract }: Props = $props();

	function getContractTypeLabel(type: 'service' | 'event-planning'): string {
		return type === 'service' ? 'Service' : 'Event Planning';
	}

	function getContractLink(contract: UnifiedContract): string {
		return contract.type === 'service'
			? `/contracts/service?edit=${contract.id}`
			: `/contracts/event-planning?edit=${contract.id}`;
	}
</script>

<div class="py-3 border-b border-dotted border-border">
	<!-- Mobile: Stacked Layout -->
	<div class="md:hidden space-y-4">
		<!-- Title and Type Badge -->
		<div class="flex items-start justify-between gap-3">
			<h3 class="text-xl font-bold leading-tight flex-1 tracking-tight">
				{contract.eventName}
			</h3>
			<Badge variant="outline" class="shrink-0">
				{getContractTypeLabel(contract.type)}
			</Badge>
		</div>

		<!-- Details -->
		<div class="space-y-2 text-sm text-muted-foreground">
			<div class="flex items-center gap-2.5">
				<Calendar class="h-4 w-4 shrink-0" />
				<span class="tracking-wide">{formatDateString(contract.date)}</span>
			</div>
			<div class="flex items-center gap-2.5">
				<MapPin class="h-4 w-4 shrink-0" />
				<span class="truncate">{contract.location}</span>
			</div>
			<div class="flex items-center gap-2.5">
				<User class="h-4 w-4 shrink-0" />
				<span class="truncate">{contract.clientName}</span>
			</div>
		</div>

		<!-- Value and Status -->
		<div class="flex items-center justify-between pt-1">
			<div class="text-base font-bold text-emerald-600 dark:text-emerald-400">
				{formatCurrency(contract.contractValue)}
			</div>
			{#if contract.paymentStatus === 'paid'}
				<Badge variant="default" class="bg-emerald-500 hover:bg-emerald-600">Paid</Badge>
			{:else}
				<Badge variant="secondary">Unpaid</Badge>
			{/if}
		</div>

		<!-- Actions -->
		<div class="pt-2">
			<Button size="sm" href={getContractLink(contract)} class="w-full">
				<Pencil class="h-3.5 w-3.5 mr-1.5" />
				Edit
			</Button>
		</div>
	</div>

	<!-- Desktop: Grid Layout (16 columns for better spacing) -->
	<div class="hidden md:grid grid-cols-16 gap-3 items-center">
		<!-- Event Name -->
		<div class="col-span-4">
			<h3 class="text-sm font-bold tracking-tight truncate">
				{contract.eventName}
			</h3>
		</div>

		<!-- Client Name -->
		<div class="col-span-3 text-sm truncate">
			{contract.clientName}
		</div>

		<!-- Contract Value -->
		<div
			class="col-span-2 text-sm font-bold text-emerald-600 dark:text-emerald-400 text-right tabular-nums"
		>
			{formatCurrency(contract.contractValue)}
		</div>

		<!-- Date -->
		<div class="col-span-2 text-sm text-center tracking-wide">
			{formatDateString(contract.date)}
		</div>

		<!-- Location -->
		<div class="col-span-2 text-sm truncate">
			{contract.location}
		</div>

		<!-- Type Badge -->
		<div class="col-span-1 flex justify-center">
			<Badge variant="outline">
				{getContractTypeLabel(contract.type)}
			</Badge>
		</div>

		<!-- Payment Status Badge -->
		<div class="col-span-1 flex justify-center">
			{#if contract.paymentStatus === 'paid'}
				<Badge variant="default" class="bg-emerald-500 hover:bg-emerald-600">Paid</Badge>
			{:else}
				<Badge variant="secondary">Unpaid</Badge>
			{/if}
		</div>

		<!-- Edit Button -->
		<div class="col-span-1 flex justify-end">
			<Button size="sm" href={getContractLink(contract)} class="px-2">
				<Pencil class="h-4 w-4" />
			</Button>
		</div>
	</div>
</div>
