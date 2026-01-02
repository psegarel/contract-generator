<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import AppShell from '$lib/components/AppShell.svelte';
	import { Toaster } from '$lib/components/ui/sonner';
	import { page } from '$app/state';
	import { authState } from '$lib/state/auth.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	let { children } = $props();
	const isLoginPage = $derived(page.url.pathname === '/login');

	$effect(() => {
		if (authState.initialized && !authState.loading) {
			if (!authState.isAuthenticated && !isLoginPage) {
				goto(resolve('/login'));
			}
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="min-h-screen bg-background text-foreground">
	{#if authState.loading || (authState.initialized && !authState.isAuthenticated && !isLoginPage)}
		<div class="flex items-center justify-center min-h-screen">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
		</div>
	{:else if isLoginPage}
		{@render children()}
	{:else if authState.isAuthenticated}
		<AppShell>
			{@render children()}
		</AppShell>
	{/if}
	<Toaster richColors position="top-center" />
</div>

