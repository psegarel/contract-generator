<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
	import { themeStore } from '$lib/stores/theme.svelte';
	import { signOut } from '$lib/utils/auth';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { LogOut, User, Sun, Moon, Menu, X } from 'lucide-svelte';

	let mobileMenuOpen = $state(false);

	async function handleSignOut() {
		try {
			await signOut();
			goto(resolve('/'));
			mobileMenuOpen = false;
		} catch (error) {
			console.error('Error signing out:', error);
		}
	}

	function closeMobileMenu() {
		mobileMenuOpen = false;
	}
</script>

<header class="bg-background border-b border-border">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex justify-between items-center h-14">
			<a
				href={resolve('/')}
				class="text-foreground hover:text-foreground/80 transition-colors font-medium"
			>
				Contract Generator
			</a>

			<!-- Desktop Navigation -->
			<nav class="hidden md:flex items-center space-x-6">
				{#if authStore.isAuthenticated}
					<a
						href={resolve('/clients')}
						class="text-muted-foreground hover:text-foreground transition-colors text-sm"
					>
						Clients
					</a>
					<a
						href={resolve('/contracts')}
						class="text-muted-foreground hover:text-foreground transition-colors text-sm"
					>
						Contracts
					</a>
					<div class="flex items-center space-x-2 text-muted-foreground text-sm">
						<User class="h-4 w-4" />
						<span class="hidden lg:inline">{authStore.user?.email}</span>
					</div>
					<button
						onclick={handleSignOut}
						class="flex items-center space-x-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
					>
						<LogOut class="h-4 w-4" />
						<span>Sign Out</span>
					</button>
				{/if}

				<!-- Theme Toggle -->
				<button
					onclick={() => themeStore.toggle()}
					class="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
					aria-label="Toggle theme"
				>
					{#if themeStore.theme === 'dark'}
						<Sun class="h-4 w-4" />
					{:else}
						<Moon class="h-4 w-4" />
					{/if}
				</button>
			</nav>

			<!-- Mobile Menu Button -->
			<div class="flex md:hidden items-center space-x-2">
				<!-- Theme Toggle (Mobile) -->
				<button
					onclick={() => themeStore.toggle()}
					class="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
					aria-label="Toggle theme"
				>
					{#if themeStore.theme === 'dark'}
						<Sun class="h-4 w-4" />
					{:else}
						<Moon class="h-4 w-4" />
					{/if}
				</button>

				{#if authStore.isAuthenticated}
					<button
						onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
						class="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
						aria-label="Toggle menu"
					>
						{#if mobileMenuOpen}
							<X class="h-5 w-5" />
						{:else}
							<Menu class="h-5 w-5" />
						{/if}
					</button>
				{/if}
			</div>
		</div>

		<!-- Mobile Menu -->
		{#if mobileMenuOpen && authStore.isAuthenticated}
			<div class="md:hidden py-4 space-y-3 border-t border-border">
				<a
					href={resolve('/clients')}
					onclick={closeMobileMenu}
					class="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
				>
					Clients
				</a>
				<a
					href={resolve('/contracts')}
					onclick={closeMobileMenu}
					class="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
				>
					Contracts
				</a>
				<div class="px-3 py-2 text-sm text-muted-foreground flex items-center space-x-2">
					<User class="h-4 w-4" />
					<span class="truncate">{authStore.user?.email}</span>
				</div>
				<button
					onclick={handleSignOut}
					class="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors flex items-center space-x-2"
				>
					<LogOut class="h-4 w-4" />
					<span>Sign Out</span>
				</button>
			</div>
		{/if}
	</div>
</header>
