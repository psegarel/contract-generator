<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import LoginForm from '$lib/components/LoginForm.svelte';

	// Redirect authenticated users on mount
	onMount(() => {
		if (authStore.isAuthenticated) {
			goto('/contracts', { replaceState: true });
		}
	});
</script>

{#if authStore.loading}
	<div class="min-h-screen flex items-center justify-center bg-background">
		<div class="text-center">
			<div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
			<p class="mt-4 text-muted-foreground">Loading...</p>
		</div>
	</div>
{:else if !authStore.isAuthenticated}
	<div class="min-h-screen flex items-center justify-center px-4 py-12">
		<LoginForm />
	</div>
{/if}
