<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
	import { themeStore } from '$lib/stores/theme.svelte';
	import { signOut } from '$lib/utils/auth';
	import { goto } from '$app/navigation';
	import { LogOut, User, Sun, Moon } from 'lucide-svelte';

	async function handleSignOut() {
		try {
			await signOut();
			goto('/');
		} catch (error) {
			console.error('Error signing out:', error);
		}
	}
</script>

<header class="bg-background border-b border-border">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex justify-between items-center h-14">
			<a href="/" class="text-foreground hover:text-foreground/80 transition-colors font-medium">
				Contract Generator
			</a>

			<nav class="flex items-center space-x-6">
				{#if authStore.isAuthenticated}
					<a
						href="/clients"
						class="text-muted-foreground hover:text-foreground transition-colors text-sm"
					>
						Clients
					</a>
					<a
						href="/contracts"
						class="text-muted-foreground hover:text-foreground transition-colors text-sm"
					>
						Contracts
					</a>
					<div class="flex items-center space-x-2 text-muted-foreground text-sm">
						<User class="h-4 w-4" />
						<span>{authStore.user?.email}</span>
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
		</div>
	</div>
</header>
