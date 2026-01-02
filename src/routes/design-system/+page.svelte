<script lang="ts">
	import { FileText, Users, DollarSign, Clock, TrendingUp, Download, CheckCircle, AlertCircle } from 'lucide-svelte';
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';

	const stats = [
		{ label: 'Total Revenue', value: '$45,231.89', change: '+20.1%', icon: DollarSign, color: 'text-emerald-500' },
		{ label: 'Active Contracts', value: '128', change: '+12', icon: FileText, color: 'text-blue-500' },
		{ label: 'Pending Signature', value: '14', change: '-2', icon: Clock, color: 'text-amber-500' },
		{ label: 'Satisfaction', value: '98%', change: '+5%', icon: TrendingUp, color: 'text-purple-500' },
	];

	const recentContracts = [
		{ id: '1', client: 'Acme Corp', type: 'Service', amount: '$12,000', status: 'Paid', date: '2024-12-28' },
		{ id: '2', client: 'Globex Inc', type: 'Event', amount: '$8,500', status: 'Pending', date: '2024-12-30' },
		{ id: '3', client: 'Soylent Corp', type: 'Service', amount: '$3,400', status: 'Draft', date: '2025-01-01' },
		{ id: '4', client: 'Initech', type: 'Event', amount: '$25,000', status: 'Paid', date: '2024-12-25' },
		{ id: '5', client: 'Umbrella Corp', type: 'Service', amount: '$1,200', status: 'Overdue', date: '2024-12-20' },
	];
</script>

<div class="space-y-8">
	<!-- Stats Grid - Using full width -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
		{#each stats as stat}
			<Card class="border-none shadow-sm bg-background/50 hover:bg-background transition-colors group">
				<CardContent class="p-6">
					<div class="flex items-center justify-between space-x-4">
						<div class="space-y-1">
							<p class="text-xs font-bold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
							<p class="text-3xl font-black tabular-nums">{stat.value}</p>
						</div>
						<div class="p-3 bg-muted/50 rounded-2xl group-hover:scale-110 transition-transform">
							<stat.icon class="h-6 w-6 {stat.color}" />
						</div>
					</div>
					<div class="mt-4 flex items-center text-xs font-bold">
						<TrendingUp class="h-3 w-3 mr-1 {stat.change.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}" />
						<span class={stat.change.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}>
							{stat.change}
						</span>
						<span class="text-muted-foreground ml-1">since last month</span>
					</div>
				</CardContent>
			</Card>
		{/each}
	</div>

	<!-- Main Grid Area - Demonstrating full screen usage -->
	<div class="grid grid-cols-1 xl:grid-cols-3 gap-8">
		<!-- Large Table Section (Takes 2/3 of xl width) -->
		<div class="xl:col-span-2 space-y-4">
			<div class="flex items-center justify-between px-2">
				<h2 class="text-2xl font-bold flex items-center">
					Recent Contracts
					<span class="ml-3 text-xs font-medium px-2 py-0.5 bg-muted rounded-full">Updated 5m ago</span>
				</h2>
				<button class="text-sm font-bold text-primary hover:underline">View all</button>
			</div>
			
			<div class="bg-background/50 rounded-3xl overflow-hidden border border-border/50">
				<table class="w-full text-left border-collapse">
					<thead>
						<tr class="bg-muted/30 border-b border-border">
							<th class="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Client</th>
							<th class="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Type</th>
							<th class="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Amount</th>
							<th class="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground text-center">Status</th>
							<th class="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Date</th>
							<th class="px-6 py-4"></th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border/30">
						{#each recentContracts as contract}
							<tr class="hover:bg-muted/20 transition-colors group">
								<td class="px-6 py-4">
									<p class="font-bold text-sm tracking-tight">{contract.client}</p>
									<p class="text-[10px] text-muted-foreground">#CTR-{Number(contract.id)*123}</p>
								</td>
								<td class="px-6 py-4 text-sm font-medium">{contract.type}</td>
								<td class="px-6 py-4 text-sm font-black tabular-nums">{contract.amount}</td>
								<td class="px-6 py-4 text-center">
									<Badge 
										variant={contract.status === 'Paid' ? 'default' : 'secondary'}
										class="rounded-full px-3 py-0.5 text-[10px] font-bold uppercase
										{contract.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : ''}
										{contract.status === 'Overdue' ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' : ''}"
									>
										{contract.status}
									</Badge>
								</td>
								<td class="px-6 py-4 text-sm text-muted-foreground font-medium">{contract.date}</td>
								<td class="px-6 py-4 text-right">
									<button class="p-2 rounded-lg hover:bg-muted opacity-0 group-hover:opacity-100 transition-all">
										<Download class="h-4 w-4" />
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>

		<!-- Side Panel (Quick Actions / Highlights) -->
		<div class="space-y-6">
			<Card class="border-none shadow-sm bg-primary/5 ring-1 ring-primary/10 rounded-3xl overflow-hidden relative">
				<div class="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>
				<CardHeader>
					<CardTitle class="text-lg">Pro Feature: Automations</CardTitle>
				</CardHeader>
				<CardContent class="space-y-4">
					<p class="text-sm text-muted-foreground">Automatically send reminders to clients with overdue contracts.</p>
					<button class="w-full bg-primary text-primary-foreground font-bold py-3 rounded-2xl shadow-lg shadow-primary/20">
						Enable Auto-Reminders
					</button>
				</CardContent>
			</Card>

			<Card class="border-none shadow-sm bg-background/50 rounded-3xl">
				<CardHeader>
					<CardTitle class="text-lg">Recent Feed</CardTitle>
				</CardHeader>
				<CardContent class="px-0">
					<div class="space-y-0 divide-y divide-border/30">
						<div class="flex items-start space-x-4 p-4 hover:bg-muted/10 transition-colors">
							<div class="mt-1 p-2 bg-emerald-500/10 rounded-full">
								<CheckCircle class="h-4 w-4 text-emerald-600" />
							</div>
							<div>
								<p class="text-xs font-bold">Acme Corp paid $12,000</p>
								<p class="text-[10px] text-muted-foreground">2 hours ago</p>
							</div>
						</div>
						<div class="flex items-start space-x-4 p-4 hover:bg-muted/10 transition-colors">
							<div class="mt-1 p-2 bg-blue-500/10 rounded-full">
								<Users class="h-4 w-4 text-blue-600" />
							</div>
							<div>
								<p class="text-xs font-bold">New contact: Cyberdyne Systems</p>
								<p class="text-[10px] text-muted-foreground">5 hours ago</p>
							</div>
						</div>
						<div class="flex items-start space-x-4 p-4 hover:bg-muted/10 transition-colors">
							<div class="mt-1 p-2 bg-amber-500/10 rounded-full">
								<AlertCircle class="h-4 w-4 text-amber-600" />
							</div>
							<div>
								<p class="text-xs font-bold">Contract #828 expired</p>
								<p class="text-[10px] text-muted-foreground">1 day ago</p>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	</div>
</div>
