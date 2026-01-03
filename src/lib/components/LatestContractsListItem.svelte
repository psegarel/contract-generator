<script lang="ts">
	import type { UnifiedContract } from '$lib/utils/mergeContracts';
	import { Calendar, MapPin, User, ExternalLink } from 'lucide-svelte';
	import { Badge } from '$lib/components/ui/badge';

	interface Props {
		contract: UnifiedContract;
	}

	let { contract }: Props = $props();

	function formatDateString(dateString: string): string {
		if (!dateString) return 'N/A';
		const date = new Date(dateString);
		return new Intl.DateTimeFormat('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		})
			.format(date)
			.toUpperCase();
	}

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('vi-VN', {
			style: 'currency',
			currency: 'VND'
		}).format(amount);
	}

	function getContractTypeLabel(type: 'service' | 'event-planning'): string {
		return type === 'service' ? 'Service' : 'Event Planning';
	}

	function getContractLink(contract: UnifiedContract): string {
		return contract.type === 'service'
			? `/contracts/service?edit=${contract.id}`
			: `/contracts/event-planning?edit=${contract.id}`;
	}
</script>

<a
	href={getContractLink(contract)}
	class="block py-3 border-b border-dotted border-border hover:bg-accent/50 transition-colors group"
>
	<!-- Mobile: Stacked Layout -->
	<div class="md:hidden space-y-3 px-1">
		<!-- Title and Type Badge -->
		<div class="flex items-start justify-between gap-3">
			<h3 class="text-base font-bold leading-tight flex-1 tracking-tight">
				{contract.eventName}
			</h3>
			<Badge variant="outline" class="shrink-0">
				{getContractTypeLabel(contract.type)}
			</Badge>
		</div>

		<!-- Details -->
		<div class="space-y-1.5 text-sm text-muted-foreground">
			<div class="flex items-center gap-2.5">
				<Calendar class="h-3.5 w-3.5 shrink-0" />
				<span class="tracking-wide">{formatDateString(contract.date)}</span>
			</div>
			<div class="flex items-center gap-2.5">
				<MapPin class="h-3.5 w-3.5 shrink-0" />
				<span class="truncate">{contract.location}</span>
			</div>
			<div class="flex items-center gap-2.5">
				<User class="h-3.5 w-3.5 shrink-0" />
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
	</div>

	<!-- Desktop: Grid Layout -->
	<div class="hidden md:grid grid-cols-12 gap-4 items-center px-1">
		<!-- Event Name -->
		<div class="col-span-3 flex items-center gap-2">
			<h3 class="text-sm font-bold tracking-tight truncate">
				{contract.eventName}
			</h3>
			<ExternalLink class="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
		</div>

		<!-- Client Name -->
		<div class="col-span-2 text-sm truncate">
			{contract.clientName}
		</div>

		<!-- Contract Value -->
		<div class="col-span-2 text-sm font-bold text-emerald-600 dark:text-emerald-400 text-right tabular-nums">
			{formatCurrency(contract.contractValue)}
		</div>

		<!-- Date -->
		<div class="col-span-2 text-xs text-center tracking-wide text-foreground/70 font-medium">
			{formatDateString(contract.date)}
		</div>

		<!-- Location -->
		<div class="col-span-2 text-xs text-muted-foreground/60 truncate">
			{contract.location}
		</div>

		<!-- Type & Payment Status Badges -->
		<div class="col-span-1 flex gap-1.5 justify-end items-center">
			<Badge variant="outline" class="text-xs">
				{getContractTypeLabel(contract.type)}
			</Badge>
			{#if contract.paymentStatus === 'paid'}
				<Badge variant="default" class="bg-emerald-500 hover:bg-emerald-600 text-xs">Paid</Badge>
			{:else}
				<Badge variant="secondary" class="text-xs">Unpaid</Badge>
			{/if}
		</div>
	</div>
</a>
