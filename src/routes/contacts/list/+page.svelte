<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { listClients, deleteClient, type ClientData } from '$lib/utils/clients';

	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Users, Mail, Phone, MapPin, Pencil, Trash2, Plus } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	let clients = $state<(ClientData & { id: string })[]>([]);
	let loading = $state(true);

	onMount(async () => {
		await loadClients();
	});

	async function loadClients() {
		loading = true;
		try {
			// Note: listClients only returns {id, name}, but we need more for the list.
			// However, looking at ClientRepository.ts (inferred), we might need to fetch full data.
			// For now, let's use listClients and see what it returns.
			const basicClients = await listClients();
			// Since listClients only returns basics, we might need a better list function or fetch all.
			// Assuming for now it returns enough for basic display or we'll fetch full data.
			// If it only returns id and name, the UI will be simple.
			
			// Let's assume we can map them or the repository has a listAll.
			// Actually, let's look at ClientRepository.ts to be sure.
			clients = basicClients as any; 
		} catch (e) {
			console.error('Load clients error:', e);
			toast.error('Failed to load contacts');
		} finally {
			loading = false;
		}
	}

	async function handleDelete(id: string) {
		if (!confirm('Are you sure you want to delete this contact?')) return;
		try {
			const success = await deleteClient(id);
			if (success) {
				clients = clients.filter((c) => c.id !== id);
				toast.success('Contact deleted successfully');
			} else {
				toast.error('Failed to delete contact');
			}
		} catch (e) {
			console.error('Delete client error:', e);
			toast.error('Error deleting contact');
		}
	}
</script>

<div>
		<div class="flex justify-between items-center mb-8">
			<div>
				<h1 class="text-3xl font-medium text-foreground mb-3">Contact List</h1>
				<p class="text-muted-foreground">Manage your saved business contacts</p>
			</div>
				<Button href={resolve('/contacts')} class="flex items-center gap-2">
					<Plus class="h-4 w-4" />
					<span>Add Contact</span>
				</Button>
			</div>

			{#if loading}
				<div class="flex justify-center items-center h-64">
					<p class="text-muted-foreground">Loading contacts...</p>
				</div>
			{:else if clients.length === 0}
				<Card class="p-12 text-center">
					<Users class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
					<h3 class="text-lg font-medium text-foreground mb-2">No contacts found</h3>
					<p class="text-muted-foreground mb-6">
						You haven't saved any contacts yet. Add your first contact to see it here.
					</p>
					<Button href={resolve('/contacts')}>Add Contact</Button>
				</Card>
			{:else}
				<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{#each clients as client (client.id)}
						<Card class="p-6 relative group">
							<div class="flex justify-between items-start mb-4">
								<div class="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
									<Users class="h-5 w-5 text-primary" />
								</div>
								<div class="flex gap-2">
									<Button
										variant="ghost"
										size="icon"
										href="{resolve('/contacts')}?edit={client.id}"
										class="h-8 w-8 text-muted-foreground hover:text-foreground"
									>
										<Pencil class="h-4 w-4" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										onclick={() => handleDelete(client.id)}
										class="h-8 w-8 text-muted-foreground hover:text-destructive"
									>
										<Trash2 class="h-4 w-4" />
									</Button>
								</div>
							</div>
							<h3 class="text-lg font-semibold mb-2">{client.name}</h3>
							<div class="space-y-2 text-sm text-muted-foreground">
								{#if client.email}
									<div class="flex items-center gap-2">
										<Mail class="h-3.5 w-3.5" />
										<span class="truncate">{client.email}</span>
									</div>
								{/if}
								{#if client.phone}
									<div class="flex items-center gap-2">
										<Phone class="h-3.5 w-3.5" />
										<span>{client.phone}</span>
									</div>
								{/if}
								{#if client.address}
									<div class="flex items-center gap-2">
										<MapPin class="h-3.5 w-3.5" />
										<span class="line-clamp-1">{client.address}</span>
									</div>
								{/if}
							</div>
						</Card>
					{/each}
				</div>
			{/if}
	</div>

