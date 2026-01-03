<script lang="ts">
	import { authState } from '$lib/state/auth.svelte';
	import { signOut } from '$lib/utils/auth';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Settings, Search, Bell, LogOut } from 'lucide-svelte';
	import * as Avatar from '$lib/components/ui/avatar';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import Sidebar from './Sidebar.svelte';

	let { children } = $props();
	let sidebarOpen = $state(true);

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
</script>

<div class="flex h-screen bg-background overflow-hidden text-foreground">
	<!-- Sidebar -->
	<Sidebar bind:sidebarOpen currentPath={page.url.pathname} />

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

				<div class="h-6 w-px bg-border mx-2"></div>

				{#if authState.isAuthenticated}
					<DropdownMenu.Root>
						<DropdownMenu.Trigger
							class="flex items-center gap-3 group px-2 py-1 rounded-full hover:bg-muted transition-colors"
						>
							<div class="text-right hidden sm:block">
								<p class="text-xs font-bold leading-none truncate max-w-30">
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
						<DropdownMenu.Content
							align="end"
							class="w-56 rounded-2xl p-2 shadow-xl border-border/50 glass"
						>
							<DropdownMenu.Label class="px-3 py-2">
								<p
									class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1"
								>
									Signed in as
								</p>
								<p class="text-sm font-medium truncate">{authState.user?.email}</p>
							</DropdownMenu.Label>
							<DropdownMenu.Separator class="my-1 bg-border/50" />
							<DropdownMenu.Item
								onSelect={() => goto(resolve('/'))}
								class="rounded-xl px-3 py-2 cursor-pointer"
							>
								<Settings class="h-4 w-4 mr-2" />
								<span>Settings</span>
							</DropdownMenu.Item>
							<DropdownMenu.Separator class="my-1 bg-border/50" />
							<DropdownMenu.Item
								onSelect={handleSignOut}
								class="rounded-xl px-3 py-2 cursor-pointer text-destructive focus:text-destructive"
							>
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
			<div class="max-w-400 mx-auto">
				{@render children()}
			</div>
		</section>
	</main>
</div>
