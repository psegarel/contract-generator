<script lang="ts">
	import { authState } from '$lib/state/auth.svelte';
	import { LayoutDashboard } from 'lucide-svelte';
</script>

<div class="p-8">
	<div class="max-w-4xl">
		<div class="flex items-center gap-3 mb-8">
			<div class="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
				<LayoutDashboard class="w-6 h-6" />
			</div>
			<div>
				<h1 class="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
				<p class="text-muted-foreground mt-1 text-sm">Welcome back, {authState.user?.email}</p>
			</div>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
			<!-- Future Stats Cards -->
			<div class="p-6 rounded-2xl border border-border bg-card/50 backdrop-blur-sm">
				<div class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total Contracts</div>
				<div class="text-3xl font-bold">0</div>
			</div>
			<div class="p-6 rounded-2xl border border-border bg-card/50 backdrop-blur-sm">
				<div class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Active Projects</div>
				<div class="text-3xl font-bold">0</div>
			</div>
			<div class="p-6 rounded-2xl border border-border bg-card/50 backdrop-blur-sm">
				<div class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Pending Sync</div>
				<div class="text-3xl font-bold">0</div>
			</div>
		</div>
	</div>
</div>

