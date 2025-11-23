<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
	import { signOut } from '$lib/utils/auth';
	import { goto } from '$app/navigation';
	import { LogOut, FileText, User } from 'lucide-svelte';

	async function handleSignOut() {
		try {
			await signOut();
			goto('/');
		} catch (error) {
			console.error('Error signing out:', error);
		}
	}
</script>

<header class="bg-white shadow-sm border-b border-gray-200">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex justify-between items-center h-16">
			<a href="/" class="flex items-center space-x-2 text-gray-900 hover:text-blue-600 transition-colors">
				<FileText class="h-6 w-6" />
				<span class="font-bold text-xl">Contract Generator</span>
			</a>

			<nav class="flex items-center space-x-4">
				{#if authStore.isAuthenticated}
					<div class="flex items-center space-x-4">
						<a 
							href="/contracts" 
							class="text-gray-700 hover:text-blue-600 transition-colors font-medium"
						>
							Contracts
						</a>
						<div class="flex items-center space-x-2 text-gray-600">
							<User class="h-4 w-4" />
							<span class="text-sm">{authStore.user?.email}</span>
						</div>
						<button
							onclick={handleSignOut}
							class="flex items-center space-x-1 px-4 py-2 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
						>
							<LogOut class="h-4 w-4" />
							<span>Sign Out</span>
						</button>
					</div>
				{:else}
					<a
						href="/login"
						class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
					>
						Log In
					</a>
				{/if}
			</nav>
		</div>
	</div>
</header>
