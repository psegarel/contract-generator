<script lang="ts">
	import { authState } from '$lib/state/auth.svelte';
	import { LatestContractsList } from '$lib/components/v2/contracts';
	import { eventState } from '$lib/state/v2';
	import { formatCurrency } from '$lib/utils/formatting';
	import { LayoutDashboard, TrendingUp, Calendar, FileText } from 'lucide-svelte';
	import DashboardCard from '$lib/components/DashboardCard.svelte';

	// Initialize event state for financial calculations
	$effect(() => {
		eventState.init();
		return () => eventState.destroy();
	});

	// Calculate total receivables and payables across all events
	let totalReceivable = $derived(
		eventState.events.reduce((sum, event) => sum + event.totalReceivable, 0)
	);

	let totalPayable = $derived(
		eventState.events.reduce((sum, event) => sum + event.totalPayable, 0)
	);

	let netRevenue = $derived(totalReceivable - totalPayable);

	let upcomingEventsCount = $derived(eventState.upcoming.length);
</script>

<div class="p-8">
	<div>
		<div class="flex items-center gap-3 mb-8">
			<div>
				<h1 class="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
				<p class="text-muted-foreground mt-1 text-sm">Welcome back, {authState.user?.email}</p>
			</div>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-4 gap-6">
			<!-- Net Revenue -->
			<DashboardCard backgroundColor="bg-indigo-500/20" textColor="text-indigo-900">
				<div class="flex items-start justify-between">
					<div class="flex-1">
						<div class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
							Net Revenue
						</div>
						<div class="text-2xl font-bold">{formatCurrency(netRevenue)}</div>
					</div>
					<TrendingUp class="w-8 h-8 opacity-50" />
				</div>
			</DashboardCard>

			<!-- Total Receivable -->
			<DashboardCard backgroundColor="bg-emerald-500/20" textColor="text-emerald-900">
				<div class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
					Total Receivable
				</div>
				<div class="text-2xl font-bold">{formatCurrency(totalReceivable)}</div>
			</DashboardCard>

			<!-- Total Payable -->
			<DashboardCard backgroundColor="bg-red-500/20" textColor="text-red-900">
				<div class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
					Total Payable
				</div>
				<div class="text-2xl font-bold">{formatCurrency(totalPayable)}</div>
			</DashboardCard>

			<!-- Upcoming Events -->
			<DashboardCard backgroundColor="bg-blue-500/20" textColor="text-blue-900">
				<div class="flex items-start justify-between">
					<div class="flex-1">
						<div class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
							Upcoming Events
						</div>
						<div class="text-2xl font-bold">{upcomingEventsCount}</div>
					</div>
					<Calendar class="w-8 h-8 opacity-50" />
				</div>
			</DashboardCard>
		</div>

		<!-- Latest Contracts Section -->
		<div class="mt-8">
			<LatestContractsList limit={10} />
		</div>
	</div>
</div>
