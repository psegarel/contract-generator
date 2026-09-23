<script lang="ts">
	import { onMount } from 'svelte';
	import { authState } from '$lib/state/auth.svelte';
	import { signOut } from '$lib/utils/auth';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page, navigating } from '$app/state';
	import { LogOut, Menu } from '@lucide/svelte';
	import Avatar from '$lib/components/ui/avatar/avatar.svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import Sidebar from './Sidebar.svelte';
	import { Button } from '$lib/components/ui/button';
	import { logger } from '$lib/utils/logger';

	let { children } = $props();
	let sidebarOpen = $state(false);
	let isMobile = $state(false);
	let wasNavigating = $state(false);

	// Track navigation state and close sidebar on mobile when navigation completes
	$effect(() => {
		if (navigating !== null) {
			// Navigation started
			wasNavigating = true;
		} else if (wasNavigating && isMobile && sidebarOpen) {
			// Navigation just completed, close sidebar on mobile
			sidebarOpen = false;
			wasNavigating = false;
		}
	});

	// On desktop, sidebar should be open by default
	onMount(() => {
		if (typeof window !== 'undefined') {
			const mediaQuery = window.matchMedia('(min-width: 1024px)');
			const checkViewport = () => {
				isMobile = !mediaQuery.matches;
				if (mediaQuery.matches) {
					sidebarOpen = true;
				} else {
					sidebarOpen = false;
				}
			};

			checkViewport();
			mediaQuery.addEventListener('change', checkViewport);

			return () => {
				mediaQuery.removeEventListener('change', checkViewport);
			};
		}
	});

	async function handleSignOut() {
		try {
			await signOut();
			goto(resolve('/login'));
		} catch (error) {
			logger.error('Error signing out:', error);
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
</script>

<div class="flex h-screen bg-background overflow-hidden text-foreground">
	<!-- Backdrop Overlay (Mobile Only) -->
	{#if sidebarOpen && isMobile}
		<div
			class="fixed inset-0 bg-black/50 z-40 transition-opacity"
			onclick={() => (sidebarOpen = false)}
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					sidebarOpen = false;
				}
			}}
			role="button"
			tabindex="-1"
			aria-label="Close sidebar"
		></div>
	{/if}

	<!-- Sidebar -->
	<Sidebar bind:sidebarOpen currentPath={page.url.pathname} />

	<!-- Main Content Area -->
	<main class="flex-1 flex flex-col h-full relative overflow-hidden">
		<!-- Top Bar -->
		<header class="h-14 bg-background flex items-center justify-between px-4 md:px-8 z-20 w-full">
			<!-- Hamburger Menu Button (Mobile Only) -->
			<Button
				variant="ghost"
				size="icon"
				onclick={() => (sidebarOpen = !sidebarOpen)}
				class="lg:hidden"
				aria-label="Toggle sidebar"
			>
				<Menu class="h-5 w-5" />
			</Button>

			<div class="flex items-center space-x-4 ml-auto">
				{#if authState.isAuthenticated}
					<DropdownMenu.Root>
						<DropdownMenu.Trigger
							class="flex items-center gap-3 group px-2 py-1 rounded-full hover:bg-muted transition-colors"
						>
							<Avatar
								initials={getInitials(authState.user?.email)}
								class="h-9 w-9"
								fallbackClass="bg-primary text-primary-foreground text-xs font-bold"
							/>
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="end" class="w-56 rounded-sm p-2 bg-popover">
							<DropdownMenu.Label class="px-3 py-2">
								<p
									class="mb-1 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
								>
									Signed in as
								</p>
								<p class="text-sm font-medium truncate">{authState.user?.email}</p>
							</DropdownMenu.Label>
							<DropdownMenu.Separator class="my-1 bg-muted" />
							<DropdownMenu.Item
								onSelect={handleSignOut}
								class="rounded-sm px-3 py-2 cursor-pointer text-destructive focus:text-destructive"
							>
								<LogOut class="h-4 w-4 mr-2" />
								<span>Sign Out</span>
							</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				{:else}
					<Button onclick={() => goto(resolve('/login'))}>Sign In</Button>
				{/if}
			</div>
		</header>

		<!-- Fluid Viewport -->
		<section class="relative flex-1 overflow-y-auto bg-background p-6 md:p-8">
			<div class="max-w-7xl mx-auto">
				{@render children()}
			</div>
		</section>
	</main>
</div>
