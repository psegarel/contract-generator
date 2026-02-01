<script lang="ts">
	import { authState } from '$lib/state/auth.svelte';
	import { LatestContractsList } from '$lib/components/v2/contracts';
	import {
		serviceProvisionContractState,
		eventPlanningContractState,
		equipmentRentalContractState
	} from '$lib/state/v2';
	import { formatCurrency } from '$lib/utils/formatting';
	import { calculateDashboardStats } from '$lib/utils/v2/dashboardStats';
	import type { BaseContract } from '$lib/types/v2';
	import { TrendingUp } from 'lucide-svelte';
	import DashboardCard from '$lib/components/DashboardCard.svelte';

	// Initialize contract states that have existing collections
	$effect(() => {
		serviceProvisionContractState.init();
		eventPlanningContractState.init();
		equipmentRentalContractState.init();

		// TODO: Initialize these when their collections are created:
		// venueRentalContractState.init();
		// performerBookingContractState.init();
		// subcontractorContractState.init();
		// clientServiceContractState.init();

		return () => {
			serviceProvisionContractState.destroy();
			eventPlanningContractState.destroy();
			equipmentRentalContractState.destroy();
		};
	});

	// Merge all contracts into a single array
	// Only include contract states that are initialized
	let allContracts = $derived<BaseContract[]>([
		...serviceProvisionContractState.contracts,
		...eventPlanningContractState.contracts,
		...equipmentRentalContractState.contracts
		// Add other contract types when their collections exist:
		// ...venueRentalContractState.contracts,
		// ...performerBookingContractState.contracts,
		// ...subcontractorContractState.contracts,
		// ...clientServiceContractState.contracts
	]);

	// Calculate dashboard stats from all contracts (filtered by date range)
	let stats = $derived(calculateDashboardStats(allContracts));

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

		<!-- Latest Contracts Section -->
		<div class="mt-8">
			<LatestContractsList limit={10} />
		</div>
	</div>
</div>
