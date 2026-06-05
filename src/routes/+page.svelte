<script lang="ts">
	import { authState } from '$lib/state/auth.svelte';
	import { LatestContractsList } from '$lib/components/v2/contracts';
	import {
		serviceProvisionContractState,
		eventPlanningContractState,
		equipmentRentalContractState,
		paymentState
	} from '$lib/state/v2';
	import { formatCurrency } from '$lib/utils/formatting';
	import { calculateDashboardStatsFromPayments } from '$lib/utils/v2/dashboardStats';
	import { TrendingUp } from 'lucide-svelte';
	import DashboardCard from '$lib/components/DashboardCard.svelte';
	import {
		seedDjResidencyContract,
		type SeedResult
	} from '$lib/migration/seedDjResidencyContract';
	import {
		getDjResidencyContracts,
		createDjResidencyMonthlyPayments
	} from '$lib/utils/v2/djResidencyContracts';
	import { deletePaymentsByContract } from '$lib/utils/v2/payments';

	// Initialize contract states (for LatestContractsList) and payment state (for dashboard stats)
	$effect(() => {
		serviceProvisionContractState.init();
		eventPlanningContractState.init();
		equipmentRentalContractState.init();
		paymentState.init();

		return () => {
			serviceProvisionContractState.destroy();
			eventPlanningContractState.destroy();
			equipmentRentalContractState.destroy();
			paymentState.destroy();
		};
	});

	// Calculate dashboard stats from payment records
	let stats = $derived(calculateDashboardStatsFromPayments(paymentState.payments));

	let netRevenue = $derived(stats.netRevenue);
	let totalReceivable = $derived(stats.totalReceivable);
	let totalPayable = $derived(stats.totalPayable);
	let totalPaid = $derived(stats.totalPaid);

	// ── TEMPORARY: Seed DJR-20260205-9759 ─────────────────────────────────────
	let seedRunning = $state(false);
	let seedResult = $state<SeedResult | null>(null);

	async function runSeed(dryRun: boolean) {
		seedRunning = true;
		seedResult = null;
		try {
			seedResult = await seedDjResidencyContract(dryRun);
		} finally {
			seedRunning = false;
		}
	}

	let paymentSeedRunning = $state(false);
	let paymentSeedLog = $state<string[]>([]);

	async function createSeededContractPayments() {
		paymentSeedRunning = true;
		paymentSeedLog = [];
		try {
			const contracts = await getDjResidencyContracts();
			const contract = contracts.find((c) => c.contractNumber === 'DJR-20260205-9759');
			if (!contract) {
				paymentSeedLog = ['❌ Contract DJR-20260205-9759 not found in Firestore'];
				return;
			}
			paymentSeedLog = [`Found contract: ${contract.id}`];
			await deletePaymentsByContract(contract.id);
			paymentSeedLog = [...paymentSeedLog, 'Deleted existing payment records'];
			await createDjResidencyMonthlyPayments({
				id: contract.id,
				contractNumber: contract.contractNumber,
				counterpartyName: contract.counterpartyName,
				paymentDirection: 'receivable',
				paymentStatus: contract.paymentStatus,
				contractValue: contract.contractValue,
				currency: 'VND',
				ownerUid: contract.ownerUid,
				contractStartDate: contract.contractStartDate,
				contractEndDate: contract.contractEndDate,
				performanceFeeVND: contract.performanceFeeVND,
				numberOfSetsPerDay: contract.numberOfSetsPerDay
			});
			paymentSeedLog = [...paymentSeedLog, '✓ Created 4 monthly payment records (Feb–May 2026)'];
		} catch (err) {
			paymentSeedLog = [...paymentSeedLog, `❌ Error: ${err instanceof Error ? err.message : String(err)}`];
		} finally {
			paymentSeedRunning = false;
		}
	}
	// ──────────────────────────────────────────────────────────────────────────

</script>

<div class="py-8">
	<div>
		<div class="flex items-center gap-3 mb-8">
			<div>
				<h1 class="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
				<p class="text-muted-foreground mt-1 text-sm">Welcome back, {authState.user?.email}</p>
			</div>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
			<!-- Total Received -->
			<DashboardCard backgroundColor="bg-indigo-500/20" textColor="text-indigo-900">
				<div class="flex items-start justify-between">
					<div class="flex-1">
						<div
							class="text-[10px] md:text-[9px] lg:text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1"
						>
							Total Received
						</div>
						<div class="text-lg md:text-base lg:text-2xl font-bold">
							{formatCurrency(netRevenue)}
						</div>
					</div>
					<TrendingUp class="w-6 h-6 md:w-5 md:h-5 lg:w-8 lg:h-8 opacity-50 shrink-0" />
				</div>
			</DashboardCard>

			<!-- Total Receivable -->
			<DashboardCard backgroundColor="bg-emerald-500/20" textColor="text-emerald-900">
				<div
					class="text-[10px] md:text-[9px] lg:text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1"
				>
					Total Receivable
				</div>
				<div class="text-lg md:text-base lg:text-2xl font-bold">
					{formatCurrency(totalReceivable)}
				</div>
			</DashboardCard>

			<!-- Total Payable -->
			<DashboardCard backgroundColor="bg-red-500/20" textColor="text-red-900">
				<div
					class="text-[10px] md:text-[9px] lg:text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1"
				>
					Total Payable
				</div>
				<div class="text-lg md:text-base lg:text-2xl font-bold">{formatCurrency(totalPayable)}</div>
			</DashboardCard>

			<!-- Total Paid -->
			<DashboardCard backgroundColor="bg-purple-500/20" textColor="text-purple-900">
				<div
					class="text-[10px] md:text-[9px] lg:text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1"
				>
					Total Paid
				</div>
				<div class="text-lg md:text-base lg:text-2xl font-bold">{formatCurrency(totalPaid)}</div>
			</DashboardCard>
		</div>

		<!-- Latest Contracts Section -->
		<div class="mt-8">
			<LatestContractsList limit={10} />
		</div>

		<!-- ── TEMPORARY: Seed DJR-20260205-9759 ────────────────────────────── -->
		<div class="mt-10 border border-dashed border-amber-400 rounded-lg p-6 bg-amber-50">
			<p class="text-xs font-bold uppercase tracking-widest text-amber-700 mb-3">
				[DEV] Seed — DJ Residency Contract DJR-20260205-9759 (BLUSH HỘI AN)
			</p>
			<div class="flex gap-3">
				<button
					onclick={() => runSeed(true)}
					disabled={seedRunning}
					class="px-4 py-2 rounded-md text-sm font-medium bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 disabled:opacity-50"
				>
					{seedRunning ? 'Running…' : 'Dry Run'}
				</button>
				<button
					onclick={() => runSeed(false)}
					disabled={seedRunning}
					class="px-4 py-2 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
				>
					{seedRunning ? 'Running…' : 'Run Live'}
				</button>
			</div>

			{#if seedResult}
				<div class="mt-4 bg-white border border-amber-200 rounded-md p-4">
					<p class="text-xs font-semibold text-amber-700 mb-2">
						{seedResult.dryRun ? 'DRY RUN output:' : 'LIVE RUN output:'}
					</p>
					<pre class="text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">{seedResult.logs.join('\n')}</pre>
					{#if !seedResult.dryRun && seedResult.contractId}
						<a
							href="/contracts/dj-residency/{seedResult.contractId}"
							class="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline"
						>
							View contract →
						</a>
					{/if}
				</div>
			{/if}

			<div class="mt-4 pt-4 border-t border-amber-200">
				<p class="text-xs text-amber-700 mb-2 font-medium">
					Step 2 — Create monthly payment records for DJR-20260205-9759
				</p>
				<button
					onclick={createSeededContractPayments}
					disabled={paymentSeedRunning}
					class="px-4 py-2 rounded-md text-sm font-medium bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 disabled:opacity-50"
				>
					{paymentSeedRunning ? 'Creating...' : 'Create Payment Records'}
				</button>
				{#if paymentSeedLog.length > 0}
					<pre class="mt-2 text-xs text-gray-700 font-mono">{paymentSeedLog.join('\n')}</pre>
				{/if}
			</div>
		</div>
		<!-- ─────────────────────────────────────────────────────────────────── -->

	</div>
</div>
