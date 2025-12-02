<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import { authStore } from '$lib/stores/auth.svelte';
	import { toast } from 'svelte-sonner';
	import {
		listClients,
		getClient,
		upsertClient,
		deleteClient,
		type ClientData
	} from '$lib/utils/clients';
	import { onMount } from 'svelte';

	interface Props {
		/** Callback when client data changes */
		onClientChange?: (data: ClientData | null) => void;
		/** Show save/delete buttons (for standalone client management) */
		showActions?: boolean;
		/** Initial client data to populate the form */
		initialData?: ClientData;
		/** Custom title for the entity (e.g., 'Client', 'Service Provider') */
		entityTitle?: string;
	}

	let {
		onClientChange,
		showActions = false,
		initialData,
		entityTitle = 'Client'
	}: Props = $props();

	let clients = $state<{ id: string; name: string }[]>([]);
	let selectedClientId = $state('');
	let saveLoading = $state(false);
	let deleteLoading = $state(false);
	let saveMessage = $state('');
	let searchQuery = $state('');
	let showDropdown = $state(false);

	// Filtered clients based on search query
	let filteredClients = $derived(
		searchQuery
			? clients.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
			: clients
	);

	let formData = $state<ClientData>({
		name: initialData?.name || '',
		email: initialData?.email || '',
		phone: initialData?.phone || '',
		address: initialData?.address || '',
		idDocument: initialData?.idDocument || '',
		taxId: initialData?.taxId || null,
		bankName: initialData?.bankName || null,
		accountNumber: initialData?.accountNumber || null
	});

	// Watch for form data changes and notify parent
	$effect(() => {
		if (onClientChange) {
			onClientChange(formData);
		}
	});

	onMount(async () => {
		if (authStore.isAuthenticated) {
			try {
				clients = await listClients();
			} catch (e) {
				console.error('Load clients error:', e);
			}
		}
	});

	async function handleClientSelect(id: string) {
		if (!id) return;
		selectedClientId = id;
		const selectedClient = clients.find((c) => c.id === id);
		searchQuery = selectedClient?.name || '';
		showDropdown = false;
		try {
			const profile = await getClient(id);
			if (profile) {
				formData.name = profile.name;
				formData.email = profile.email;
				formData.phone = profile.phone;
				formData.address = profile.address;
				formData.idDocument = profile.idDocument;
				formData.taxId = profile.taxId || null;
				formData.bankName = profile.bankName || null;
				formData.accountNumber = profile.accountNumber || null;
			}
		} catch (e) {
			console.error('Fetch client error:', e);
		}
	}

	function handleSearchFocus() {
		showDropdown = true;
	}

	function handleSearchBlur() {
		// Delay to allow click events on dropdown items
		setTimeout(() => {
			showDropdown = false;
		}, 200);
	}

	function handleClearSearch() {
		searchQuery = '';
		selectedClientId = '';
		showDropdown = false;
	}

	async function saveClientProfile() {
		if (!authStore.user) {
			toast.error('You must be signed in to save clients.');
			return;
		}
		saveLoading = true;
		saveMessage = '';
		try {
			const id = await upsertClient(authStore.user.uid, formData, selectedClientId || undefined);
			toast.success('Client saved successfully!');
			clients = await listClients();
			selectedClientId = id;
		} catch (e) {
			console.error('Save client error:', e);
			toast.error('Failed to save client.');
		} finally {
			saveLoading = false;
		}
	}

	async function handleDeleteClient() {
		if (!selectedClientId) return;
		if (!confirm('Are you sure you want to delete this client?')) return;

		deleteLoading = true;
		try {
			const success = await deleteClient(selectedClientId);
			if (success) {
				selectedClientId = '';
				formData = {
					name: '',
					email: '',
					phone: '',
					address: '',
					idDocument: '',
					taxId: null,
					bankName: null,
					accountNumber: null
				};
				clients = await listClients();
				toast.success('Client deleted successfully!');
			} else {
				toast.error('Failed to delete client.');
			}
		} catch (e) {
			console.error('Delete client error:', e);
			toast.error('Failed to delete client.');
		} finally {
			deleteLoading = false;
		}
	}

	$effect(() => {
		if (selectedClientId) {
			handleClientSelect(selectedClientId);
		}
	});
</script>

<div class="space-y-4">
	<!-- Client Selector with Search -->
	<div class="space-y-2">
		<Label for="clientSearch">{entityTitle}</Label>
		<div class="relative">
			<Input
				id="clientSearch"
				type="text"
				bind:value={searchQuery}
				onfocus={handleSearchFocus}
				onblur={handleSearchBlur}
				placeholder="Search or select a {entityTitle.toLowerCase()}..."
				class="w-full"
			/>
			{#if searchQuery && !showDropdown}
				<button
					type="button"
					onclick={handleClearSearch}
					class="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
				>
					×
				</button>
			{/if}
			{#if showDropdown && filteredClients.length > 0}
				<div
					class="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto"
				>
					{#each filteredClients as client (client.id)}
						<button
							type="button"
							onclick={() => handleClientSelect(client.id)}
							class="w-full text-left px-4 py-2 hover:bg-accent hover:text-accent-foreground transition-colors"
						>
							{client.name}
						</button>
					{/each}
				</div>
			{:else if showDropdown && searchQuery && filteredClients.length === 0}
				<div
					class="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg px-4 py-2 text-muted-foreground text-sm"
				>
					No {entityTitle.toLowerCase()}s found
				</div>
			{/if}
		</div>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		<!-- Client Name -->
		<div class="space-y-2">
			<Label for="clientName">{entityTitle} Name *</Label>
			<Input
				id="clientName"
				type="text"
				bind:value={formData.name}
				placeholder="John Doe"
				required
			/>
		</div>

		<!-- Email -->
		<div class="space-y-2">
			<Label for="clientEmail">Email Address *</Label>
			<Input
				id="clientEmail"
				type="email"
				bind:value={formData.email}
				placeholder="john@example.com"
				required
			/>
		</div>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		<!-- Client Phone -->
		<div class="space-y-2">
			<Label for="clientPhone">Phone Number *</Label>
			<Input
				id="clientPhone"
				type="tel"
				bind:value={formData.phone}
				placeholder="+1 234 567 890"
				required
			/>
		</div>

		<!-- ID Document -->
		<div class="space-y-2">
			<Label for="idDocument">ID Card / Passport Number *</Label>
			<Input
				id="idDocument"
				type="text"
				bind:value={formData.idDocument}
				placeholder="ID or Passport Number"
				required
			/>
		</div>
	</div>

	<!-- Client Address -->
	<div class="space-y-2">
		<Label for="clientAddress">Address *</Label>
		<Input
			id="clientAddress"
			type="text"
			bind:value={formData.address}
			placeholder="123 Main St, City, Country"
			required
		/>
	</div>

	<!-- Tax ID -->
	<div class="space-y-2">
		<Label for="clientTaxId">Tax ID (Optional)</Label>
		<Input id="clientTaxId" type="text" bind:value={formData.taxId} placeholder="Tax Code" />
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		<!-- Bank Name -->
		<div class="space-y-2">
			<Label for="bankName">Bank Name (Optional)</Label>
			<Input
				id="bankName"
				type="text"
				bind:value={formData.bankName}
				placeholder="e.g., Vietcombank"
			/>
		</div>

		<!-- Account Number -->
		<div class="space-y-2">
			<Label for="accountNumber">Account Number (Optional)</Label>
			<Input
				id="accountNumber"
				type="text"
				bind:value={formData.accountNumber}
				placeholder="Account number"
			/>
		</div>
	</div>

	<!-- Action Buttons (only shown if showActions is true) -->
	{#if showActions}
		<div class="pt-2 flex gap-3 items-center">
			<Button type="button" variant="secondary" onclick={saveClientProfile} disabled={saveLoading}>
				{#if saveLoading}Saving...{:else}Save {entityTitle}{/if}
			</Button>
			{#if selectedClientId}
				<Button
					type="button"
					variant="destructive"
					onclick={handleDeleteClient}
					disabled={deleteLoading}
				>
					{#if deleteLoading}Deleting...{:else}Delete {entityTitle}{/if}
				</Button>
			{/if}
			{#if saveMessage}
				<span class="text-sm text-muted-foreground">{saveMessage}</span>
			{/if}
		</div>
	{/if}
</div>
