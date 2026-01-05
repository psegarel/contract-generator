<script lang="ts">
	import { resolve } from '$app/paths';
	import {
		LayoutDashboard,
		Users,
		FileText,
		CalendarCheck,
		FileCode,
		Palette,
		PanelLeft
	} from 'lucide-svelte';
	import type { ComponentType } from 'svelte';
	import SidebarMenuItem from './SidebarMenuItem.svelte';

	interface SubItem {
		label: string;
		href: string;
	}

	interface MenuItem {
		icon: ComponentType;
		label: string;
		href: string;
		subItems?: SubItem[];
	}

	let {
		sidebarOpen = $bindable(true),
		currentPath = ''
	}: {
		sidebarOpen?: boolean;
		currentPath?: string;
	} = $props();

	const menuItems: MenuItem[] = [
		{ icon: LayoutDashboard, label: 'Dashboard', href: resolve('/') },
		{
			icon: FileText,
			label: 'Service Contracts',
			href: '#',
			subItems: [
				{ label: 'List', href: resolve('/contracts/service-provision/list') },
				{ label: 'Create', href: resolve('/contracts/service-provision') }
			]
		},
		{
			icon: CalendarCheck,
			label: 'Event Planning',
			href: '#',
			subItems: [
				{ label: 'List', href: resolve('/contracts/event-planning/list') },
				{ label: 'Create', href: resolve('/contracts/event-planning') }
			]
		},
		{
			icon: CalendarCheck,
			label: 'Events',
			href: resolve('/events')
		},
		{ icon: Users, label: 'Counterparties', href: resolve('/counterparties') },
		{
			icon: PanelLeft,
			label: 'Legacy V1',
			href: '#',
			subItems: [
				{ label: 'Dashboard', href: resolve('/v1') },
				{ label: 'Contracts', href: resolve('/v1/contracts') },
				{ label: 'Contacts', href: resolve('/v1/contacts/list') },
				{ label: 'Design System', href: resolve('/v1/design-system') }
			]
		}
	];

	let expandedItems = $state<Record<string, boolean>>(
		Object.fromEntries(menuItems.map((item) => [item.label, false]))
	);

	const isActive = (item: MenuItem) => {
		if (currentPath === item.href) return true;
		if (item.subItems) {
			return item.subItems.some((sub) => currentPath === sub.href);
		}
		return false;
	};
</script>

<aside
	class="relative h-full border-r border-sidebar transition-all duration-300 ease-in-out z-30
	{sidebarOpen ? 'w-64' : 'w-20'}"
>
	<div class="flex flex-col h-full bg-sidebar text-sidebar-foreground">
		<!-- Logo Area with Sidebar Toggle -->
		<div class="h-16 flex items-center justify-between px-4 border-b border-sidebar">
			<div class="flex items-center min-w-0 overflow-hidden">
				<div
					class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ease-in-out {sidebarOpen
						? 'opacity-100 scale-100'
						: 'opacity-0 scale-75 pointer-events-none'}"
				>
					<FileCode class="text-primary-foreground h-5 w-5" />
				</div>
				<span
					class="ml-3 font-bold text-lg text-sidebar-foreground tracking-tight whitespace-nowrap transition-all duration-300 ease-in-out {sidebarOpen
						? 'opacity-100 translate-x-0'
						: 'opacity-0 -translate-x-4 pointer-events-none'}"
				>
					Insense
				</span>
			</div>
			<button
				onclick={() => (sidebarOpen = !sidebarOpen)}
				class="p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors shrink-0"
				title={sidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
			>
				<PanelLeft class="h-5 w-5" />
			</button>
		</div>

		<!-- Navigation -->
		<nav class="flex-1 overflow-y-auto py-6 px-4 space-y-2">
			{#each menuItems as item (item.label)}
				<SidebarMenuItem
					icon={item.icon}
					label={item.label}
					href={item.href}
					subItems={item.subItems}
					isActive={isActive(item)}
					{sidebarOpen}
					bind:expanded={expandedItems[item.label]}
					{currentPath}
				/>
			{/each}
		</nav>

		<!-- Sidebar Footer (for future use) -->
		<!-- <div class="p-4 border-t border-sidebar">
			Theme toggle would go here
		</div> -->
	</div>
</aside>
