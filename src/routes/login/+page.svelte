<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { authStore } from '$lib/stores/auth.svelte';
	import LoginForm from '$lib/components/LoginForm.svelte';

	// Reactive effect that redirects authenticated users
	$effect(() => {
		if (authStore.initialized && authStore.isAuthenticated) {
			goto(resolve('/contracts'), { replaceState: true });
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
