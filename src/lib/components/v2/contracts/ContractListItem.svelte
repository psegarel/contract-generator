<script lang="ts">
	import type { BaseContract } from '$lib/types/v2';
	import { formatDateString, formatCurrency } from '$lib/utils/formatting';
	import { Calendar, User, Pencil } from 'lucide-svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';

	interface Props {
		contract: BaseContract;
		index: number;
		getLink?: (c: BaseContract) => string;
	}

	let { contract, index, getLink }: Props = $props();

	function getContractTypeLabel(type: BaseContract['type']): string {
		const labels: Record<BaseContract['type'], string> = {
			'venue-rental': 'Venue',
			'performer-booking': 'Performer',
			'equipment-rental': 'Equipment',
			'service-provision': 'Service',
			'event-planning': 'Event Planning',
			subcontractor: 'Subcontractor',
			'client-service': 'Client Service'
		};
		return labels[type];
	}

	function getDefaultContractLink(contract: BaseContract): string {
		return `/contracts/${contract.type}/${contract.id}`;
	}

	function getPaymentDirectionBadge(direction: BaseContract['paymentDirection']) {
		return direction === 'receivable'
			? { variant: 'default' as const, label: 'AR', class: 'bg-blue-500 hover:bg-blue-600' }
			: {
					variant: 'secondary' as const,
					label: 'AP',
					class: 'bg-amber-500 hover:bg-amber-600 text-white'
				};
	}

	let paymentDirBadge = $derived(getPaymentDirectionBadge(contract.paymentDirection));
</script>

<div class={index % 2 === 0 ? 'bg-white' : 'bg-slate-100/80'}>
	<!-- Mobile: Stacked Layout -->
	<div class="md:hidden space-y-4 py-3">
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
				<span class="tracking-wide"
					>{formatDateString(contract.createdAt.toDate().toISOString())}</span
				>
			</div>
			<div class="flex items-center gap-2.5">
				<User class="h-4 w-4 shrink-0" />
				<span class="truncate">{contract.counterpartyName}</span>
			</div>
		</div>

		<!-- Value and Status -->
		<div class="flex items-center justify-between pt-1">
			<div class="text-base font-bold text-emerald-600 dark:text-emerald-400">
				{formatCurrency(contract.contractValue)}
			</div>
			<div class="flex gap-2">
				<Badge {...paymentDirBadge}>{paymentDirBadge.label}</Badge>
				{#if contract.paymentStatus === 'paid'}
					<Badge variant="default" class="bg-emerald-500 hover:bg-emerald-600">Paid</Badge>
				{:else}
					<Badge variant="secondary">Unpaid</Badge>
				{/if}
			</div>
		</div>

		<!-- Actions -->
		<div class="pt-2">
			<Button size="sm" href={(getLink ?? getDefaultContractLink)(contract)} class="w-full">
				<Pencil class="h-3.5 w-3.5 mr-1.5" />
				View
			</Button>
		</div>
	</div>

	<!-- Desktop: Grid Layout (18 columns for payment direction) -->
	<div class="hidden md:grid grid-cols-18 gap-3 items-center py-3 px-4">
		<!-- Contract Number -->
		<div class="col-span-2">
			<h3 class="text-sm font-bold tracking-tight truncate">
				{contract.contractNumber}
			</h3>
		</div>

		<!-- Event Name -->
		<div class="col-span-3 text-sm truncate">
			{contract.eventName}
		</div>

		<!-- Counterparty Name -->
		<div class="col-span-3 text-sm truncate">
			{contract.counterpartyName}
		</div>

		<!-- Contract Value -->
		<div
			class="col-span-2 text-sm font-bold text-emerald-600 dark:text-emerald-400 text-right tabular-nums"
		>
			{formatCurrency(contract.contractValue)}
		</div>

		<!-- Date -->
		<div class="col-span-2 text-sm text-center tracking-wide">
			{formatDateString(contract.createdAt.toDate().toISOString())}
		</div>

		<!-- Type Badge -->
		<div class="col-span-2 flex justify-center">
			<Badge variant="outline">
				{getContractTypeLabel(contract.type)}
			</Badge>
		</div>

		<!-- Payment Direction -->
		<div class="col-span-1 flex justify-center">
			<Badge {...paymentDirBadge}>{paymentDirBadge.label}</Badge>
		</div>

		<!-- Payment Status Badge -->
		<div class="col-span-2 flex justify-center">
			{#if contract.paymentStatus === 'paid'}
				<Badge variant="default" class="bg-emerald-500 hover:bg-emerald-600">Paid</Badge>
			{:else}
				<Badge variant="secondary">Unpaid</Badge>
			{/if}
		</div>

		<!-- View Button -->
		<div class="col-span-1 flex justify-center">
			<Button size="sm" href={(getLink ?? getDefaultContractLink)(contract)} class="px-2">
				<Pencil class="h-4 w-4" />
			</Button>
		</div>
	</div>
</div>
