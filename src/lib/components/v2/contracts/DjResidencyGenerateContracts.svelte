<script lang="ts">
	import type { DjResidencyContract, ClientCounterparty, PerformanceLog } from '$lib/types/v2';
	import {
		subscribeToPerformances,
		generateMonthlyContracts,
		unlockMonth
	} from '$lib/utils/v2/djResidencyContracts';
	import { authState } from '$lib/state/auth.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { FileText, Lock, LockOpen } from '@lucide/svelte';
	import { formatCurrency, formatMonthLabel } from '$lib/utils/formatting';
	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import type { Unsubscribe } from 'firebase/firestore';

	interface Props {
		contract: DjResidencyContract;
		venueCounterparty: ClientCounterparty;
	}

	let { contract, venueCounterparty }: Props = $props();

	let performances = $state<PerformanceLog[]>([]);
	let isLoading = $state(true);
	let generatingMonth = $state<string | null>(null);
	let unlockingMonth = $state<string | null>(null);

	let unsubscribe: Unsubscribe | null = null;

	onMount(() => {
		unsubscribe = subscribeToPerformances(
			contract.id,
			(data) => {
				performances = data;
				isLoading = false;
			},
			() => {
				toast.error('Failed to load performances');
				isLoading = false;
			}
		);
		return () => unsubscribe?.();
	});

	// Uninvoiced performances grouped by month
	let uninvoicedByMonth = $derived.by(() => {
		const grouped: Record<string, PerformanceLog[]> = {};
		for (const p of performances) {
			if (p.invoiced) continue;
			const month = p.date.substring(0, 7);
			if (!grouped[month]) grouped[month] = [];
			grouped[month].push(p);
		}
		return grouped;
	});

	// Locked months (all performances invoiced) sorted newest first
	let lockedMonths = $derived.by(() => {
		const months = new SvelteSet<string>();
		for (const p of performances) {
			if (p.invoiced && p.invoiceMonth) months.add(p.invoiceMonth);
		}
		return [...months].sort().reverse();
	});

	let availableMonths = $derived(Object.keys(uninvoicedByMonth).sort());

	async function handleUnlockMonth(month: string) {
		if (
			!confirm(
				`Unlock ${formatMonthLabel(month)}?\n\nThis will delete all generated service contracts and payment records for this month, and allow the performance logs to be edited and re-invoiced.`
			)
		) {
			return;
		}

		unlockingMonth = month;
		try {
			await unlockMonth(contract.id, month);
			toast.success(`${formatMonthLabel(month)} unlocked — performances can now be edited`);
		} catch (error) {
			toast.error((error as Error).message || 'Failed to unlock month');
		} finally {
			unlockingMonth = null;
		}
	}

	async function handleGenerateContracts(month: string) {
		if (!authState.user) {
			toast.error('You must be logged in');
			return;
		}

		const monthPerformances = uninvoicedByMonth[month];
		if (!monthPerformances?.length) return;

		generatingMonth = month;
		try {
			const result = await generateMonthlyContracts(
				contract.id,
				month,
				contract,
				venueCounterparty,
				authState.user.uid,
				monthPerformances
			);
			toast.success(
				`Contracts generated for ${formatMonthLabel(month)}: ${result.serviceContractCount} service contract(s) totalling ${formatCurrency(result.totalAmount)}`
			);
		} catch (error) {
			toast.error((error as Error).message || 'Failed to generate contracts');
		} finally {
			generatingMonth = null;
		}
	}
</script>

<div class="bg-card p-6">
	<h3 class="text-lg font-semibold text-foreground mb-6">Generate Contracts</h3>

	{#if isLoading}
		<div class="text-center py-8 text-muted-foreground">Loading...</div>
	{:else}
		<!-- Months ready for contract generation -->
		{#if availableMonths.length > 0}
			<div class="space-y-3 mb-6">
				<p class="text-sm text-muted-foreground mb-3">
					Months with uninvoiced performances ready for contract generation:
				</p>
				{#each availableMonths as month (month)}
					{@const monthPerfs = uninvoicedByMonth[month]}
					{@const total = monthPerfs.reduce(
						(sum, p) => sum + p.hoursWorked * contract.performanceFeeVND,
						0
					)}
					{@const performerCount = new Set(monthPerfs.map((p) => p.performerId)).size}
					<div class="flex items-center justify-between bg-muted p-4">
						<div>
							<p class="font-medium text-foreground">{formatMonthLabel(month)}</p>
							<p class="text-sm text-muted-foreground">
								{monthPerfs.length} performance{monthPerfs.length !== 1 ? 's' : ''} · {performerCount}
								performer{performerCount !== 1 ? 's' : ''} · {formatCurrency(total)}
							</p>
						</div>
						<Button
							variant="dark"
							onclick={() => handleGenerateContracts(month)}
							disabled={generatingMonth === month}
						>
							{#if generatingMonth === month}
								Generating...
							{:else}
								<FileText class="w-4 h-4 mr-2" />
								Generate Contracts
							{/if}
						</Button>
					</div>
				{/each}
			</div>
		{:else if lockedMonths.length === 0}
			<div class="text-center py-6 text-muted-foreground">
				No uninvoiced performances. Log performances first to generate contracts.
			</div>
		{/if}

		<!-- Locked months -->
		{#if lockedMonths.length > 0}
			<div>
				<p class="text-sm font-medium text-foreground mb-3">Locked months</p>
				<div class="space-y-2">
					{#each lockedMonths as month (month)}
						{@const monthPerfs = performances.filter((p) => p.invoiceMonth === month)}
						{@const total = monthPerfs.reduce(
							(sum, p) => sum + p.hoursWorked * contract.performanceFeeVND,
							0
						)}
						<div class="flex items-center justify-between p-3 bg-muted/30">
							<div class="flex items-center gap-3">
								<Lock class="w-4 h-4 text-muted-foreground" />
								<div>
									<p class="font-medium text-foreground">{formatMonthLabel(month)}</p>
									<p class="text-sm text-muted-foreground">
										{monthPerfs.length} performance{monthPerfs.length !== 1 ? 's' : ''} · {formatCurrency(
											total
										)}
									</p>
								</div>
							</div>
							<div class="flex items-center gap-2">
								<Badge variant="secondary">Contracts generated</Badge>
								<Button
									variant="ghost"
									size="sm"
									onclick={() => handleUnlockMonth(month)}
									disabled={unlockingMonth === month}
									class="text-muted-foreground hover:bg-muted"
								>
									{#if unlockingMonth === month}
										Unlocking...
									{:else}
										<LockOpen class="w-4 h-4" />
									{/if}
								</Button>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</div>
