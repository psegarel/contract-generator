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
	<div class="min-h-screen flex items-center justify-center bg-background">
		<div class="text-center">
			<div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
			<p class="mt-4 text-muted-foreground">Loading...</p>
		</div>
	</div>
{:else if authStore.isAuthenticated}
	{@render children()}
{/if}
