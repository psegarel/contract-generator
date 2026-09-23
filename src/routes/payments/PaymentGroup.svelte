<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import TextField from '$lib/components/TextField.svelte';
	import { formatCurrency } from '$lib/utils/formatting';
	import { ChevronDown, ChevronRight } from '@lucide/svelte';
	import type { Payment } from '$lib/types/v2/payment';
	import { getContractTypeLabel, type PaymentGroup as PaymentGroupData } from '$lib/forms/payments';

	interface Props {
		group: PaymentGroupData;
		groupIndex: number;
		expanded: boolean;
		togglingPaymentId: string | null;
		editingAmountId: string | null;
		editingAmountValue?: number;
		onToggle: (payment: Payment) => void;
		onToggleExpanded: () => void;
		onStartEditAmount: (payment: Payment) => void;
		onSaveAmount: (payment: Payment) => void;
		onCancelEditAmount: () => void;
	}

	let {
		group,
		groupIndex,
		expanded,
		togglingPaymentId,
		editingAmountId,
		editingAmountValue = $bindable(0),
		onToggle,
		onToggleExpanded,
		onStartEditAmount,
		onSaveAmount,
		onCancelEditAmount
	}: Props = $props();

	const paidCount = $derived(group.payments.filter((payment) => payment.status === 'paid').length);
	const totalCount = $derived(group.payments.length);
	const totalAmount = $derived(group.payments.reduce((sum, payment) => sum + payment.amount, 0));
	const hasMultiple = $derived(totalCount > 1);
</script>

<div class={groupIndex % 2 === 0 ? 'bg-card' : 'bg-muted/30'}>
	<div class="flex items-center gap-3 px-4 py-3">
		{#if hasMultiple}
			<Button
				type="button"
				variant="ghost"
				size="icon-sm"
				class="shrink-0 text-muted-foreground hover:text-foreground"
				onclick={onToggleExpanded}
			>
				{#if expanded}
					<ChevronDown class="h-4 w-4" />
				{:else}
					<ChevronRight class="h-4 w-4" />
				{/if}
			</Button>
		{:else}
			<div class="w-4 shrink-0"></div>
		{/if}

		<div class="min-w-0 flex-1">
			<div class="flex flex-wrap items-center gap-2">
				<span class="truncate text-sm font-bold tracking-tight">{group.counterpartyName}</span>
				<span class="text-xs text-muted-foreground">{group.contractNumber}</span>
				<Badge variant="outline" class="text-[11px]"
					>{getContractTypeLabel(group.contractType)}</Badge
				>
			</div>
			<p class="mt-1 text-[11px] text-muted-foreground">
				{hasMultiple ? `${paidCount}/${totalCount} payments` : '1 payment'}
			</p>
		</div>

		<div class="shrink-0 text-right">
			<div class="text-sm font-bold tabular-nums text-foreground">
				{formatCurrency(totalAmount)}
			</div>
		</div>

		<div class="shrink-0">
			{#if paidCount === totalCount}
				<Badge variant="default" class="bg-emerald-500 text-[11px] hover:bg-emerald-600">
					{hasMultiple ? `${paidCount}/${totalCount} paid` : 'Paid'}
				</Badge>
			{:else}
				<Badge variant="secondary" class="text-[11px]">
					{hasMultiple ? `${paidCount}/${totalCount} paid` : 'Unpaid'}
				</Badge>
			{/if}
		</div>

		{#if !hasMultiple}
			{@const payment = group.payments[0]}
			<Button
				variant={payment.status === 'paid' ? 'outline' : 'default'}
				size="sm"
				onclick={() => onToggle(payment)}
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

	{#if hasMultiple && expanded}
		<div class="bg-muted/10">
			{#each group.payments as payment, index (payment.id)}
				<div
					class="flex items-center gap-3 px-4 py-2.5 {index % 2 === 0 ? 'bg-card' : 'bg-muted/20'}"
				>
					<div class="w-4 shrink-0"></div>
					<div class="min-w-0 flex-1">
						<span class="text-sm text-foreground">{payment.label ?? 'Payment'}</span>
					</div>
					<div class="shrink-0 text-sm tabular-nums text-muted-foreground">
						{#if editingAmountId === payment.id}
							<TextField
								id="payment-amount-{payment.id}"
								label="Payment amount"
								labelHidden
								type="number"
								bind:value={editingAmountValue}
								autofocus
								onblur={() => onSaveAmount(payment)}
								onkeydown={(event) => {
									if (event.key === 'Enter') onSaveAmount(payment);
									if (event.key === 'Escape') onCancelEditAmount();
								}}
								class="w-32"
							/>
						{:else}
							<Button
								type="button"
								variant="ghost"
								size="sm"
								class="h-auto p-0 text-sm tabular-nums {group.contractType === 'dj-residency'
									? 'cursor-pointer hover:underline'
									: 'cursor-default'}"
								title={group.contractType === 'dj-residency' ? 'Click to edit amount' : undefined}
								onclick={() => group.contractType === 'dj-residency' && onStartEditAmount(payment)}
							>
								{formatCurrency(payment.amount)}
							</Button>
						{/if}
					</div>
					<div class="shrink-0">
						{#if payment.status === 'paid'}
							<Badge variant="default" class="bg-emerald-500 text-[11px]">Paid</Badge>
						{:else}
							<Badge variant="secondary" class="text-[11px]">Pending</Badge>
						{/if}
					</div>
					<Button
						variant={payment.status === 'paid' ? 'outline' : 'default'}
						size="sm"
						onclick={() => onToggle(payment)}
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
