<script lang="ts">
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';
	import { listClients } from '$lib/utils/clients';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import ClientForm from '$lib/components/ClientForm.svelte';

	let clients = $state<{ id: string; name: string }[]>([]);
	let loading = $state(false);

	onMount(async () => {
		if (!authStore.isAuthenticated) {
			goto('/login');
			return;
		}
		await loadClients();
	});

	async function loadClients() {
		if (!authStore.user) return;
		loading = true;
		try {
			clients = await listClients(authStore.user.uid);
		} catch (e) {
			console.error('Load clients error:', e);
		} finally {
			loading = false;
		}
	}
</script>

<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
	<div class="mb-6">
		<h1 class="text-3xl font-bold text-foreground">Client Management</h1>
		<p class="text-muted-foreground mt-2">
			Manage your client profiles for quick contract generation
		</p>
	</div>

	<Card class="p-6">
		<ClientForm showActions={true} />
	</Card>

	{#if loading}
		<p class="text-center text-muted-foreground mt-6">Loading clients...</p>
	{:else if clients.length > 0}
		<div class="mt-6">
			<p class="text-sm text-muted-foreground">
				You have {clients.length} client{clients.length === 1 ? '' : 's'} saved.
			</p>
		</div>
	{/if}
</div>
