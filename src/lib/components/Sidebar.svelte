<script lang="ts">
	import { resolve } from '$app/paths';
	import {
		LayoutDashboard,
		Users,
		FileText,
		CalendarCheck,
		FileCode,
		Palette,
		Menu
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
				{ label: 'List', href: resolve('/contracts/service/list') },
				{ label: 'Create', href: resolve('/contracts/service') }
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
		{ icon: Users, label: 'Contacts', href: resolve('/contacts/list') },
		{ icon: Palette, label: 'Design System', href: resolve('/design-system') }
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
			<div class="flex items-center min-w-0">
				{#if sidebarOpen}
					<div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
						<FileCode class="text-primary-foreground h-5 w-5" />
					</div>
					<span class="ml-3 font-bold text-lg text-sidebar-foreground tracking-tight">
						Insense
					</span>
				{/if}
			</div>
			<button
				onclick={() => (sidebarOpen = !sidebarOpen)}
				class="p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors shrink-0"
				title={sidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
			>
				<Menu class="h-5 w-5" />
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
