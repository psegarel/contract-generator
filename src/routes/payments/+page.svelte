<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onDestroy, onMount } from 'svelte';
	import { authState } from '$lib/state/auth.svelte';
	import { paymentState } from '$lib/state/v2/paymentState.svelte';
	import { logger } from '$lib/utils/logger';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft } from '@lucide/svelte';
	import type { Payment } from '$lib/types/v2/payment';
	import { SvelteSet } from 'svelte/reactivity';
	import {
		filterPayments,
		groupPayments,
		savePaymentAmount,
		togglePayment,
		type PaymentDirectionFilter,
		type PaymentStatusFilter
	} from '$lib/forms/payments';
	import PaymentFilters from './PaymentFilters.svelte';
	import PaymentGroup from './PaymentGroup.svelte';

	let statusFilter = $state<PaymentStatusFilter>('all');
	let directionFilter = $state<PaymentDirectionFilter>('all');
	let contractTypeFilter = $state('all');
	let contractIdFilter = $state<string | null>(null);
	let togglingPaymentId = $state<string | null>(null);
	let expandedContracts = new SvelteSet<string>();
	let editingAmountId = $state<string | null>(null);
	let editingAmountValue = $state(0);

	onMount(() => {
		if (!authState.isAdmin) {
			goto(resolve('/'));
			return;
		}

		paymentState.init();
		const contractParam = $page.url.searchParams.get('contract');
		if (contractParam) contractIdFilter = contractParam;
	});

	onDestroy(() => paymentState.destroy());

	let filteredPayments = $derived(
		filterPayments(paymentState.payments, {
			status: statusFilter,
			direction: directionFilter,
			contractType: contractTypeFilter,
			contractId: contractIdFilter
		})
	);
	let groupedPayments = $derived(groupPayments(filteredPayments));

	function toggleExpanded(contractId: string) {
		if (expandedContracts.has(contractId)) expandedContracts.delete(contractId);
		else expandedContracts.add(contractId);
	}

	async function handleTogglePayment(payment: Payment) {
		togglingPaymentId = payment.id;
		try {
			const newStatus = await togglePayment(payment, authState.user?.uid);
			toast.success(`Payment marked as ${newStatus === 'paid' ? 'paid' : 'pending'}`);
		} catch (error) {
			logger.error('Failed to toggle payment:', error);
			toast.error(error instanceof Error ? error.message : 'Failed to update payment status');
		} finally {
			togglingPaymentId = null;
		}
	}

	function startEditAmount(payment: Payment) {
		editingAmountId = payment.id;
		editingAmountValue = payment.amount;
	}

	function cancelEditAmount() {
		editingAmountId = null;
	}

	async function handleSaveAmount(payment: Payment) {
		if (editingAmountId !== payment.id) return;
		editingAmountId = null;
		if (editingAmountValue === payment.amount) return;

		try {
			await savePaymentAmount(payment.id, editingAmountValue);
			toast.success('Amount updated');
		} catch (error) {
			logger.error('Failed to update amount:', error);
			toast.error('Failed to update amount');
		}
	}

	function clearContractFilter() {
		contractIdFilter = null;
		goto(resolve('/payments'), { replaceState: true });
	}
</script>

<div class="container mx-auto px-4 py-8">
	<div class="mb-8 flex items-center gap-4">
		<Button variant="outline" size="sm" href="/" class="shrink-0">
			<ArrowLeft class="mr-1.5 h-4 w-4" />
			Back
		</Button>
		<div>
			<h1 class="text-2xl font-bold text-foreground">Payments</h1>
			<p class="mt-0.5 text-sm text-muted-foreground">
				{filteredPayments.length} payment{filteredPayments.length === 1 ? '' : 's'}
			</p>
		</div>
	</div>

	<PaymentFilters
		bind:status={statusFilter}
		bind:direction={directionFilter}
		bind:contractType={contractTypeFilter}
		contractId={contractIdFilter}
		onClearContractFilter={clearContractFilter}
	/>

	{#if paymentState.isLoading}
		<div class="py-12 text-center text-muted-foreground">Loading payments...</div>
	{:else if groupedPayments.length === 0}
		<div class="py-12 text-center text-muted-foreground">
			<p class="mb-1 text-sm font-medium">No payments found</p>
			<p class="text-xs">Adjust your filters or create contracts with payment records.</p>
		</div>
	{:else}
		<div class="space-y-0">
			{#each groupedPayments as group, groupIndex (group.contractId)}
				<PaymentGroup
					{group}
					{groupIndex}
					expanded={expandedContracts.has(group.contractId)}
					{togglingPaymentId}
					{editingAmountId}
					bind:editingAmountValue
					onToggle={handleTogglePayment}
					onToggleExpanded={() => toggleExpanded(group.contractId)}
					onStartEditAmount={startEditAmount}
					onSaveAmount={handleSaveAmount}
					onCancelEditAmount={cancelEditAmount}
				/>
			{/each}
		</div>
	{/if}
</div>
