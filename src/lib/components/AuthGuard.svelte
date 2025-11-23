<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(() => {
		// Wait for auth to initialize
		const checkAuth = setInterval(() => {
			if (authStore.initialized) {
				clearInterval(checkAuth);
				if (!authStore.isAuthenticated) {
					goto('/login');
				}
			}
		}, 100);

		return () => clearInterval(checkAuth);
	});
</script>

{#if authStore.loading}
	<div class="min-h-screen flex items-center justify-center bg-gray-50">
		<div class="text-center">
			<div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
			<p class="mt-4 text-gray-600">Loading...</p>
		</div>
	</div>
{:else if authStore.isAuthenticated}
	{@render children()}
{/if}
