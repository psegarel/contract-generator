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
	import { migrateExistingContractPayments } from '$lib/utils/v2';
	import { toast } from 'svelte-sonner';
	import { logger } from '$lib/utils/logger';

	let isMigrating = $state(false);
	let migrationError = $state<string | null>(null);
	let migrationResult = $state<{
		totalContracts: number;
		alreadyHadPayments: number;
		created: number;
		failed: { contractId: string; contractNumber: string; error: string }[];
	} | null>(null);

	async function runMigration() {
		isMigrating = true;
		migrationResult = null;
		migrationError = null;
		try {
			migrationResult = await migrateExistingContractPayments();
			if (migrationResult.created > 0) {
				toast.success(`Migration complete: ${migrationResult.created} payment records created`);
			} else if (migrationResult.totalContracts === 0) {
				toast.info('No contracts found to migrate');
			} else {
				toast.info('All contracts already have payment records');
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			logger.error('Migration failed:', error);
			migrationError = message;
			toast.error('Migration failed: ' + message);
		} finally {
			isMigrating = false;
		}
	}

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

		<!-- Payment Migration (admin tool) -->
		{#if authState.isAdmin}
			<div class="mt-8 p-4 border border-dashed border-amber-400 rounded-lg bg-amber-50">
				<h3 class="text-sm font-semibold text-amber-900 mb-2">Payment Migration</h3>
				<p class="text-xs text-amber-700 mb-3">
					Create payment records for contracts that were saved before the payment tracking system.
					Safe to run multiple times — skips contracts that already have payments.
				</p>
				<button
					onclick={runMigration}
					disabled={isMigrating}
					class="px-3 py-1.5 text-sm font-medium rounded-md bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isMigrating ? 'Migrating...' : 'Run Migration'}
				</button>

				{#if migrationError}
					<div class="mt-3 p-2 bg-red-100 border border-red-300 rounded text-xs text-red-800">
						<span class="font-medium">Error:</span> {migrationError}
					</div>
				{/if}

				{#if migrationResult}
					<div class="mt-3 text-xs space-y-1">
						<p class="text-amber-900">
							<span class="font-medium">Total contracts:</span>
							{migrationResult.totalContracts}
						</p>
						<p class="text-amber-900">
							<span class="font-medium">Already had payments:</span>
							{migrationResult.alreadyHadPayments}
						</p>
						<p class="text-green-700">
							<span class="font-medium">Created:</span>
							{migrationResult.created}
						</p>
						{#if migrationResult.failed.length > 0}
							<p class="text-red-700 font-medium">
								Failed: {migrationResult.failed.length}
							</p>
							{#each migrationResult.failed as failure (failure.contractId)}
								<p class="text-red-600 pl-2">
									{failure.contractNumber}: {failure.error}
								</p>
							{/each}
						{/if}
					</div>
				{/if}
			</div>
		{/if}

		<!-- Latest Contracts Section -->
		<div class="mt-8">
			<LatestContractsList limit={10} />
		</div>
	</div>
</div>
