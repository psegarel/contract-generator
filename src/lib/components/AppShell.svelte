<script lang="ts">
	import { authState } from '$lib/state/auth.svelte';
	import { themeState } from '$lib/state/theme.svelte';
	import { signOut } from '$lib/utils/auth';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { 
		LayoutDashboard, 
		Users, 
		FileText, 
		Settings, 
		Search, 
		Bell, 
		Sun, 
		Moon, 
		Plus, 
		ChevronRight, 
		Menu,
		LogOut,
		CalendarCheck,
		FileCode,
		Palette
	} from 'lucide-svelte';
	import { animate } from 'motion';
	import * as Avatar from '$lib/components/ui/avatar';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';

	let { children } = $props();
	let sidebarOpen = $state(true);
	
	let expandedItems = $state<Record<string, boolean>>({});
	
	const menuItems = [
		{ icon: LayoutDashboard, label: 'Dashboard', href: resolve('/') },
		{ 
			icon: FileText, 
			label: 'Service Contracts', 
			href: '#',
			subItems: [
				{ label: 'List', href: resolve('/contracts/service/list') },
				{ label: 'Create', href: resolve('/contracts/service') },
			] 
		},
		{ 
			icon: CalendarCheck, 
			label: 'Event Planning', 
			href: '#',
			subItems: [
				{ label: 'List', href: resolve('/contracts/event-planning/list') },
				{ label: 'Create', href: resolve('/contracts/event-planning') },
			] 
		},
		{ icon: Users, label: 'Contacts', href: resolve('/contacts/list') },
		{ icon: Palette, label: 'Design System', href: resolve('/design-system') },
	];

	async function handleSignOut() {
		try {
			await signOut();
			goto(resolve('/login'));
		} catch (error) {
			console.error('Error signing out:', error);
		}
	}

	function getInitials(email: string | null | undefined): string {
		if (!email) return 'U';
		const parts = email.split('@')[0].split('.');
		if (parts.length >= 2) {
			return (parts[0][0] + parts[1][0]).toUpperCase();
		}
		return email.substring(0, 2).toUpperCase();
	}

	const isActive = (item: typeof menuItems[0]) => {
		if (page.url.pathname === item.href) return true;
		if (item.subItems) {
			return item.subItems.some(sub => page.url.pathname === sub.href);
		}
		return false;
	};

	// Action for sub-menu animations
	// Action for sub-menu animations
	function submenuAnimation(node: HTMLElement, isOpen: boolean) {
		let controls: any;
		let currentTarget = isOpen;

		const ITEM_HEIGHT = 32; // Defined by h-8
		const PADDING_OFFSET = 12; // mt-1 (4px) + pb-2 (8px)

		const runAnimation = (open: boolean) => {
			currentTarget = open;
			if (controls) controls.stop();

			const inner = node.firstElementChild as HTMLElement;
			const itemCount = inner?.children.length || 0;
			const targetHeight = open ? (itemCount * ITEM_HEIGHT) + PADDING_OFFSET : 0;
			const startHeight = node.getBoundingClientRect().height;

			if (open) {
				node.style.display = 'block';
			}

			controls = animate(
				node,
				{ 
					height: [startHeight + 'px', targetHeight + 'px'],
					opacity: open ? 1 : 0
				},
				{
					type: 'spring',
					stiffness: 200,
					damping: 25,
					mass: 0.5
				}
			);
			
			controls.then(() => {
				// Final check to ensure we don't hide it if user clicked open mid-animation
				if (!open && !currentTarget) {
					node.style.display = 'none';
				}
			});
		};

		// Set initial state
		const inner = node.firstElementChild as HTMLElement;
		const itemCount = inner?.children.length || 0;
		const targetHeight = (itemCount * ITEM_HEIGHT) + PADDING_OFFSET;

		if (!isOpen) {
			node.style.display = 'none';
			node.style.height = '0px';
			node.style.opacity = '0';
		} else {
			node.style.display = 'block';
			node.style.height = targetHeight + 'px';
			node.style.opacity = '1';
		}

		return {
			update(newIsOpen: boolean) {
				runAnimation(newIsOpen);
			},
			destroy() {
				if (controls) controls.stop();
			}
		};
	}
</script>

<div class="flex h-screen bg-background overflow-hidden text-foreground">
	<!-- Sidebar -->
	<aside 
		class="relative h-full border-r border-sidebar transition-all duration-300 ease-in-out z-30
		{sidebarOpen ? 'w-64' : 'w-20'}"
	>
		<div class="flex flex-col h-full bg-sidebar text-sidebar-foreground">
			<!-- Logo Area -->
			<div class="h-16 flex items-center px-6 border-b border-sidebar">
				<div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
					<FileCode class="text-primary-foreground h-5 w-5" />
				</div>
				<span class="ml-3 font-bold text-lg text-foreground tracking-tight transition-opacity duration-200 {sidebarOpen ? 'opacity-100' : 'opacity-0 hidden text-[0px]'}">
					Insense
				</span>
			</div>

			<!-- Navigation -->
			<nav class="flex-1 overflow-y-auto py-6 px-4 space-y-2">
				{#each menuItems as item}
					<div>
						<a 
							href={item.href}
							onclick={(e) => {
								if (item.subItems) {
									e.preventDefault();
									expandedItems[item.label] = !expandedItems[item.label];
								}
							}}
							class="flex items-center px-3 py-2.5 rounded-xl transition-all group
							{isActive(item) ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-sidebar-accent text-sidebar-foreground hover:text-foreground'}"
						>
							<item.icon class="h-5 w-5 transition-colors {isActive(item) ? 'text-primary' : 'group-hover:text-primary'}" />
							{#if sidebarOpen}
								<span class="ml-3 font-medium text-sm">{item.label}</span>
								{#if item.subItems}
									<ChevronRight class="ml-auto h-4 w-4 transition-transform {expandedItems[item.label] ? 'rotate-90' : ''}" />
								{/if}
							{/if}
						</a>
						
						{#if sidebarOpen && item.subItems}
							<div 
								use:submenuAnimation={!!expandedItems[item.label]}
								class="overflow-hidden"
							>
								<div class="ml-9 mt-1 space-y-1 pb-2">
									{#each item.subItems as sub}
										<a 
											href={sub.href} 
											class="flex items-center h-8 text-xs transition-colors
											{page.url.pathname === sub.href ? 'text-primary font-bold' : 'text-sidebar-foreground/70 hover:text-foreground'}"
										>
											{sub.label}
										</a>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				{/each}
			</nav>


			<!-- Sidebar Footer -->
			<div class="p-4 border-t border-sidebar flex flex-col items-center gap-4">
				<button 
					onclick={() => themeState.toggle()}
					class="w-full flex items-center justify-center p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground hover:text-foreground transition-colors"
					title="Toggle Theme"
				>
					{#if themeState.theme === 'dark'}
						<Sun class="h-5 w-5" />
					{:else}
						<Moon class="h-5 w-5" />
					{/if}
				</button>
				<button 
					onclick={() => sidebarOpen = !sidebarOpen}
					class="w-full flex items-center justify-center p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground hover:text-foreground transition-colors"
					title={sidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
				>
					<Menu class="h-5 w-5" />
				</button>
			</div>
		</div>
	</aside>

	<!-- Main Content Area -->
	<main class="flex-1 flex flex-col h-full relative overflow-hidden">
		<!-- Top Bar -->
		<header class="h-16 border-b border-border glass flex items-center justify-between px-8 z-20">
			<div class="flex items-center flex-1 max-w-xl">
				<div class="relative w-full">
					<Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<input 
						type="text" 
						placeholder="Search contracts, clients..." 
						class="w-full bg-muted/40 border-none rounded-full pl-10 pr-4 py-2 text-sm focus:ring-1 focus:ring-primary/20 transition-all border border-transparent focus:border-border"
					/>
				</div>
			</div>

			<div class="flex items-center space-x-4">
				<button class="p-2 rounded-full hover:bg-muted relative transition-colors group">
					<Bell class="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
					<span class="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-primary rounded-full"></span>
				</button>
				
				<div class="h-6 w-[1px] bg-border mx-2"></div>
				
				{#if authState.isAuthenticated}
					<DropdownMenu.Root>
						<DropdownMenu.Trigger class="flex items-center gap-3 group px-2 py-1 rounded-full hover:bg-muted transition-colors">
							<div class="text-right hidden sm:block">
								<p class="text-xs font-bold leading-none truncate max-w-[120px]">
									{authState.user?.email?.split('@')[0]}
								</p>
								<p class="text-[10px] text-muted-foreground mt-1 lowercase">Member</p>
							</div>
							<Avatar.Root class="h-9 w-9 border-2 border-background shadow-sm">
								<Avatar.Fallback class="bg-primary text-primary-foreground text-xs font-bold">
									{getInitials(authState.user?.email)}
								</Avatar.Fallback>
							</Avatar.Root>
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="end" class="w-56 rounded-2xl p-2 shadow-xl border-border/50 glass">
							<DropdownMenu.Label class="px-3 py-2">
								<p class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Signed in as</p>
								<p class="text-sm font-medium truncate">{authState.user?.email}</p>
							</DropdownMenu.Label>
							<DropdownMenu.Separator class="my-1 bg-border/50" />
							<DropdownMenu.Item onSelect={() => goto(resolve('/'))} class="rounded-xl px-3 py-2 cursor-pointer">
								<Settings class="h-4 w-4 mr-2" />
								<span>Settings</span>
							</DropdownMenu.Item>
							<DropdownMenu.Separator class="my-1 bg-border/50" />
							<DropdownMenu.Item onSelect={handleSignOut} class="rounded-xl px-3 py-2 cursor-pointer text-destructive focus:text-destructive">
								<LogOut class="h-4 w-4 mr-2" />
								<span>Sign Out</span>
							</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				{:else}
					<button 
						onclick={() => goto(resolve('/login'))}
						class="text-sm font-bold px-4 py-2 bg-primary text-primary-foreground rounded-full hover:scale-105 transition-transform"
					>
						Sign In
					</button>
				{/if}
			</div>
		</header>

		<!-- Fluid Viewport -->
		<section class="flex-1 overflow-y-auto p-6 md:p-8 bg-muted/5 relative">
			<div class="max-w-[1600px] mx-auto">
				{@render children()}
			</div>
		</section>
	</main>
</div>
