<script lang="ts">
	import { onMount } from 'svelte';
	import { authState } from '$lib/state/auth.svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { listClients } from '$lib/utils/clients';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { List } from 'lucide-svelte';
	import ClientForm from '$lib/components/v1/ClientForm.svelte';

	let clients = $state<{ id: string; name: string }[]>([]);
	let loading = $state(false);
	const editClientId = $derived(page.url.searchParams.get('edit') || undefined);

	onMount(async () => {
		await loadClients();
	});


	async function loadClients() {
		loading = true;
		try {
			clients = await listClients();
		} catch (e) {
			console.error('Load clients error:', e);
		} finally {
			loading = false;
		}
	}
</script>

<div>
	<div class="flex justify-between items-start mb-6">
		<div>
			<h1 class="text-3xl font-bold text-foreground">Contact Management</h1>
			<p class="text-muted-foreground mt-2">
				Manage your business contacts for quick contract generation
			</p>
		</div>
		<Button variant="outline" href={resolve('/v1/contacts/list')} class="flex items-center gap-2">
			<List class="h-4 w-4" />
			<span>View All Contacts</span>
		</Button>
	</div>

	<Card class="p-6">
		<ClientForm showActions={true} clientId={editClientId} />
	</Card>

	{#if loading}
		<p class="text-center text-muted-foreground mt-6">Loading contacts...</p>
	{:else if clients.length > 0}
		<div class="mt-6">
			<p class="text-sm text-muted-foreground">
				You have {clients.length} contact{clients.length === 1 ? '' : 's'} saved.
			</p>
		</div>
	{/if}
</div>
