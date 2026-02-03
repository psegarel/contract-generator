<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	import { authState } from '$lib/state/auth.svelte';
	import { paymentState } from '$lib/state/v2/paymentState.svelte';
	import { updatePaymentStatus, syncContractStatusFromPayments } from '$lib/utils/v2/payments';
	import { formatCurrency } from '$lib/utils/formatting';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { toast } from 'svelte-sonner';
	import { logger } from '$lib/utils/logger';
	import { ArrowLeft, ChevronDown, ChevronRight } from 'lucide-svelte';
	import type { Payment } from '$lib/types/v2/payment';
	import type { ContractType } from '$lib/types/v2';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';

	type StatusFilter = 'all' | 'pending' | 'paid';
	type DirectionFilter = 'all' | 'receivable' | 'payable';

	let statusFilter = $state<StatusFilter>('all');
	let directionFilter = $state<DirectionFilter>('all');
	let contractTypeFilter = $state<string>('all');
	let contractIdFilter = $state<string | null>(null);
	let togglingPaymentId = $state<string | null>(null);
	let expandedContracts = new SvelteSet<string>();

	onMount(() => {
		if (!authState.isAdmin) {
			goto('/');
			return;
		}
		paymentState.init();

		const contractParam = $page.url.searchParams.get('contract');
		if (contractParam) {
			contractIdFilter = contractParam;
		}
	});

	onDestroy(() => {
		paymentState.destroy();
	});

	let filteredPayments = $derived.by(() => {
		let result = paymentState.payments;

		if (contractIdFilter) {
			result = result.filter((p) => p.contractId === contractIdFilter);
		}
		if (statusFilter !== 'all') {
			result = result.filter((p) => p.status === statusFilter);
		}
		if (directionFilter !== 'all') {
			result = result.filter((p) => p.direction === directionFilter);
		}
		if (contractTypeFilter !== 'all') {
			result = result.filter((p) => p.contractType === contractTypeFilter);
		}

		return result;
	});

	let groupedPayments = $derived.by(() => {
		const groups = new SvelteMap<string, { contractNumber: string; counterpartyName: string; contractType: ContractType; contractId: string; payments: Payment[] }>();

		for (const payment of filteredPayments) {
			const existing = groups.get(payment.contractId);
			if (existing) {
				existing.payments.push(payment);
			} else {
				groups.set(payment.contractId, {
					contractNumber: payment.contractNumber,
					counterpartyName: payment.counterpartyName,
					contractType: payment.contractType,
					contractId: payment.contractId,
					payments: [payment]
				});
			}
		}

		// Reverse each group's payments so oldest is first (newest at bottom)
		for (const group of groups.values()) {
			group.payments.reverse();
		}

		return Array.from(groups.values());
	});

	function toggleExpanded(contractId: string) {
		if (expandedContracts.has(contractId)) {
			expandedContracts.delete(contractId);
		} else {
			expandedContracts.add(contractId);
		}
	}

	async function handleTogglePayment(payment: Payment) {
		if (!authState.user?.uid) {
			toast.error('You must be logged in');
			return;
		}

		togglingPaymentId = payment.id;
		const newStatus = payment.status === 'paid' ? 'pending' : 'paid';

		try {
			await updatePaymentStatus(payment.id, newStatus, authState.user.uid);
			await syncContractStatusFromPayments(payment.contractId, payment.contractType, authState.user.uid);
			toast.success(`Payment marked as ${newStatus === 'paid' ? 'paid' : 'pending'}`);
		} catch (error) {
			logger.error('Failed to toggle payment:', error);
			toast.error('Failed to update payment status');
		} finally {
			togglingPaymentId = null;
		}
	}

	function clearContractFilter() {
		contractIdFilter = null;
		const url = new URL($page.url);
		url.searchParams.delete('contract');
		goto(url.pathname, { replaceState: true });
	}

	function getContractTypeLabel(type: string): string {
		const labels: Record<string, string> = {
			'venue-rental': 'Venue',
			'performer-booking': 'Performer',
			'equipment-rental': 'Equipment',
			'service-provision': 'Service',
			'event-planning': 'Event Planning',
			subcontractor: 'Subcontractor',
			'client-service': 'Client Service'
		};
		return labels[type] ?? type;
	}
</script>

<div class="container mx-auto px-4 py-8">
	<!-- Header -->
	<div class="flex items-center gap-4 mb-8">
		<Button variant="outline" size="sm" href="/" class="shrink-0">
			<ArrowLeft class="h-4 w-4 mr-1.5" />
			Back
		</Button>
		<div>
			<h1 class="text-2xl font-bold text-gray-900">Payments</h1>
			<p class="text-sm text-muted-foreground mt-0.5">
				{filteredPayments.length} payment{filteredPayments.length === 1 ? '' : 's'}
			</p>
		</div>
	</div>

	<!-- Filters -->
	<div class="flex flex-wrap gap-3 mb-6">
		{#if contractIdFilter}
			<Button variant="outline" size="sm" onclick={clearContractFilter}>
				Filtered by contract &times;
			</Button>
		{/if}

		<select
			bind:value={statusFilter}
			class="text-sm border border-gray-300 rounded-md px-3 py-1.5"
		>
			<option value="all">All statuses</option>
			<option value="pending">Pending</option>
			<option value="paid">Paid</option>
		</select>

		<select
			bind:value={directionFilter}
			class="text-sm border border-gray-300 rounded-md px-3 py-1.5"
		>
			<option value="all">All directions</option>
			<option value="receivable">Receivable</option>
			<option value="payable">Payable</option>
		</select>

		<select
			bind:value={contractTypeFilter}
			class="text-sm border border-gray-300 rounded-md px-3 py-1.5"
		>
			<option value="all">All types</option>
			<option value="venue-rental">Venue</option>
			<option value="performer-booking">Performer</option>
			<option value="equipment-rental">Equipment</option>
			<option value="service-provision">Service</option>
			<option value="event-planning">Event Planning</option>
			<option value="subcontractor">Subcontractor</option>
			<option value="client-service">Client Service</option>
		</select>
	</div>

	<!-- Payment List -->
	{#if paymentState.isLoading}
		<div class="text-center py-12 text-muted-foreground">Loading payments...</div>
	{:else if groupedPayments.length === 0}
		<div class="text-center py-12 text-muted-foreground">
			<p class="text-sm font-medium mb-1">No payments found</p>
			<p class="text-xs">Adjust your filters or create contracts with payment records.</p>
		</div>
	{:else}
		<div class="space-y-3">
			{#each groupedPayments as group (group.contractId)}
				{@const paidCount = group.payments.filter((p) => p.status === 'paid').length}
				{@const totalCount = group.payments.length}
				{@const totalAmount = group.payments.reduce((sum, p) => sum + p.amount, 0)}
				{@const hasMultiple = totalCount > 1}
				{@const expanded = expandedContracts.has(group.contractId)}

				<div class="border border-border rounded-lg bg-white">
					<!-- Contract Group Header -->
					<div class="flex items-center gap-3 px-4 py-3">
						{#if hasMultiple}
							<button
								onclick={() => toggleExpanded(group.contractId)}
								class="shrink-0 text-muted-foreground hover:text-foreground cursor-pointer"
							>
								{#if expanded}
									<ChevronDown class="h-4 w-4" />
								{:else}
									<ChevronRight class="h-4 w-4" />
								{/if}
							</button>
						{:else}
							<div class="w-4 shrink-0"></div>
						{/if}

						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2 flex-wrap">
								<span class="text-sm font-bold truncate">{group.counterpartyName}</span>
								<span class="text-xs text-muted-foreground">{group.contractNumber}</span>
								<Badge variant="outline" class="text-xs">{getContractTypeLabel(group.contractType)}</Badge>
							</div>
						</div>

						<div class="text-sm font-bold text-emerald-600 tabular-nums shrink-0">
							{formatCurrency(totalAmount)}
						</div>

						<div class="shrink-0">
							{#if paidCount === totalCount}
								<Badge variant="default" class="bg-emerald-500">
									{hasMultiple ? `${paidCount}/${totalCount} paid` : 'Paid'}
								</Badge>
							{:else}
								<Badge variant="secondary">
									{hasMultiple ? `${paidCount}/${totalCount} paid` : 'Unpaid'}
								</Badge>
							{/if}
						</div>

						<!-- Single payment: toggle directly from header -->
						{#if !hasMultiple}
							{@const payment = group.payments[0]}
							<Button
								variant={payment.status === 'paid' ? 'outline' : 'default'}
								size="sm"
								onclick={() => handleTogglePayment(payment)}
								disabled={togglingPaymentId === payment.id}
								class="shrink-0"
							>
								{#if togglingPaymentId === payment.id}
									Updating...
								{:else if payment.status === 'paid'}
									Mark Unpaid
								{:else}
									Mark Paid
								{/if}
							</Button>
						{/if}
					</div>

					<!-- Expanded: Individual Payments -->
					{#if hasMultiple && expanded}
						<div class="border-t border-border">
							{#each group.payments as payment, i (payment.id)}
								<div
									class="flex items-center gap-3 px-4 py-2.5 {i % 2 === 0 ? 'bg-slate-50' : 'bg-white'}"
								>
									<div class="w-4 shrink-0"></div>
									<div class="flex-1 min-w-0">
										<span class="text-sm">{payment.label ?? 'Payment'}</span>
									</div>
									<div class="text-sm tabular-nums text-muted-foreground shrink-0">
										{formatCurrency(payment.amount)}
									</div>
									<div class="shrink-0">
										{#if payment.status === 'paid'}
											<Badge variant="default" class="bg-emerald-500 text-xs">Paid</Badge>
										{:else}
											<Badge variant="secondary" class="text-xs">Pending</Badge>
										{/if}
									</div>
									<Button
										variant={payment.status === 'paid' ? 'outline' : 'default'}
										size="sm"
										onclick={() => handleTogglePayment(payment)}
										disabled={togglingPaymentId === payment.id}
										class="shrink-0"
									>
										{#if togglingPaymentId === payment.id}
											...
										{:else if payment.status === 'paid'}
											Unpaid
										{:else}
											Paid
										{/if}
									</Button>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
