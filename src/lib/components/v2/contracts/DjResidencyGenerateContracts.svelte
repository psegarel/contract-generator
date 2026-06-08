<script lang="ts">
	import type { DjResidencyContract, ClientCounterparty, PerformanceLog } from '$lib/types/v2';
	import {
		subscribeToPerformances,
		generateMonthlyContracts
	} from '$lib/utils/v2/djResidencyContracts';
	import { authState } from '$lib/state/auth.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { FileText, Lock } from 'lucide-svelte';
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

<div class="bg-white rounded-lg border border-gray-200 p-6">
	<h3 class="text-lg font-semibold text-gray-900 mb-6">Generate Contracts</h3>

	{#if isLoading}
		<div class="text-center py-8 text-gray-500">Loading...</div>
	{:else}
		<!-- Months ready for contract generation -->
		{#if availableMonths.length > 0}
			<div class="space-y-3 mb-6">
				<p class="text-sm text-gray-500 mb-3">
					Months with uninvoiced performances ready for contract generation:
				</p>
				{#each availableMonths as month (month)}
					{@const monthPerfs = uninvoicedByMonth[month]}
					{@const total = monthPerfs.reduce(
						(sum, p) => sum + p.setsCompleted * contract.performanceFeeVND,
						0
					)}
					{@const performerCount = new Set(monthPerfs.map((p) => p.performerId)).size}
					<div
						class="flex items-center justify-between p-4 rounded-lg border border-amber-200 bg-amber-50"
					>
						<div>
							<p class="font-medium text-gray-900">{formatMonthLabel(month)}</p>
							<p class="text-sm text-gray-600">
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
			<div class="text-center py-6 text-gray-500">
				No uninvoiced performances. Log performances first to generate contracts.
			</div>
		{/if}

		<!-- Locked months -->
		{#if lockedMonths.length > 0}
			<div>
				<p class="text-sm font-medium text-gray-700 mb-3">Locked months</p>
				<div class="space-y-2">
					{#each lockedMonths as month (month)}
						{@const monthPerfs = performances.filter((p) => p.invoiceMonth === month)}
						{@const total = monthPerfs.reduce(
							(sum, p) => sum + p.setsCompleted * contract.performanceFeeVND,
							0
						)}
						<div
							class="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50"
						>
							<div class="flex items-center gap-3">
								<Lock class="w-4 h-4 text-gray-400" />
								<div>
									<p class="font-medium text-gray-800">{formatMonthLabel(month)}</p>
									<p class="text-sm text-gray-500">
										{monthPerfs.length} performance{monthPerfs.length !== 1 ? 's' : ''} · {formatCurrency(total)}
									</p>
								</div>
							</div>
							<Badge variant="secondary">Contracts generated</Badge>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</div>
