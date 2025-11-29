<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select';
	import { authStore } from '$lib/stores/auth.svelte';
	import { listClients, getClient, upsertClient, deleteClient, type ClientData } from '$lib/utils/clients';
	import { onMount } from 'svelte';

	interface Props {
		/** Callback when client data changes */
		onClientChange?: (data: ClientData | null) => void;
		/** Show save/delete buttons (for standalone client management) */
		showActions?: boolean;
		/** Initial client data to populate the form */
		initialData?: ClientData;
	}

	let { onClientChange, showActions = false, initialData }: Props = $props();

	let clients = $state<{ id: string; name: string }[]>([]);
	let selectedClientId = $state('');
	let saveLoading = $state(false);
	let deleteLoading = $state(false);
	let saveMessage = $state('');

	let formData = $state<ClientData>({
		name: initialData?.name || '',
		email: initialData?.email || '',
		phone: initialData?.phone || '',
		address: initialData?.address || '',
		idDocument: initialData?.idDocument || '',
		taxId: initialData?.taxId || null,
		bankName: initialData?.bankName || '',
		accountNumber: initialData?.accountNumber || ''
	});

	// Watch for form data changes and notify parent
	$effect(() => {
		if (onClientChange) {
			onClientChange(formData);
		}
	});

	onMount(async () => {
		if (authStore.isAuthenticated && authStore.user) {
			try {
				clients = await listClients(authStore.user.uid);
			} catch (e) {
				console.error('Load clients error:', e);
			}
		}
	});

	async function handleClientSelect(id: string) {
		if (!id || !authStore.user) return;
		selectedClientId = id;
		try {
			const profile = await getClient(authStore.user.uid, id);
			if (profile) {
				formData.name = profile.name;
				formData.email = profile.email;
				formData.phone = profile.phone;
				formData.address = profile.address;
				formData.idDocument = profile.idDocument;
				formData.taxId = profile.taxId || null;
				formData.bankName = profile.bankName;
				formData.accountNumber = profile.accountNumber;
			}
		} catch (e) {
			console.error('Fetch client error:', e);
		}
	}

	async function saveClientProfile() {
		if (!authStore.user) {
			alert('You must be signed in to save clients.');
			return;
		}
		saveLoading = true;
		saveMessage = '';
		try {
			const id = await upsertClient(authStore.user.uid, formData, selectedClientId || undefined);
			saveMessage = 'Client saved';
			clients = await listClients(authStore.user.uid);
			selectedClientId = id;
		} catch (e) {
			console.error('Save client error:', e);
			alert('Failed to save client.');
		} finally {
			saveLoading = false;
		}
	}

	async function handleDeleteClient() {
		if (!authStore.user || !selectedClientId) return;
		if (!confirm('Are you sure you want to delete this client?')) return;

		deleteLoading = true;
		try {
			const success = await deleteClient(authStore.user.uid, selectedClientId);
			if (success) {
				selectedClientId = '';
				formData = {
					name: '',
					email: '',
					phone: '',
					address: '',
					idDocument: '',
					taxId: null,
					bankName: '',
					accountNumber: ''
				};
				clients = await listClients(authStore.user.uid);
				saveMessage = 'Client deleted';
			} else {
				alert('Failed to delete client.');
			}
		} catch (e) {
			console.error('Delete client error:', e);
			alert('Failed to delete client.');
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
	<!-- Client Selector -->
	<div class="space-y-2">
		<Label for="clientSelect">Client</Label>
		<Select type="single" bind:value={selectedClientId}>
			<SelectTrigger class="w-full">
				<span data-slot="select-value"
					>{selectedClientId
						? clients.find((c) => c.id === selectedClientId)?.name
						: 'Choose client'}</span
				>
			</SelectTrigger>
			<SelectContent>
				{#each clients as c}
					<SelectItem value={c.id}>{c.name}</SelectItem>
				{/each}
			</SelectContent>
		</Select>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		<!-- Client Name -->
		<div class="space-y-2">
			<Label for="clientName">Client Name *</Label>
			<Input id="clientName" type="text" bind:value={formData.name} placeholder="John Doe" required />
		</div>

		<!-- Email -->
		<div class="space-y-2">
			<Label for="clientEmail">Email Address *</Label>
			<Input id="clientEmail" type="email" bind:value={formData.email} placeholder="john@example.com" required />
		</div>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		<!-- Client Phone -->
		<div class="space-y-2">
			<Label for="clientPhone">Phone Number *</Label>
			<Input id="clientPhone" type="tel" bind:value={formData.phone} placeholder="+1 234 567 890" required />
		</div>

		<!-- ID Document -->
		<div class="space-y-2">
			<Label for="idDocument">ID Card / Passport Number *</Label>
			<Input id="idDocument" type="text" bind:value={formData.idDocument} placeholder="ID or Passport Number" required />
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
			<Label for="bankName">Bank Name *</Label>
			<Input id="bankName" type="text" bind:value={formData.bankName} placeholder="e.g., Vietcombank" required />
		</div>

		<!-- Account Number -->
		<div class="space-y-2">
			<Label for="accountNumber">Account Number *</Label>
			<Input
				id="accountNumber"
				type="text"
				bind:value={formData.accountNumber}
				placeholder="Account number"
				required
			/>
		</div>
	</div>

	<!-- Action Buttons (only shown if showActions is true) -->
	{#if showActions}
		<div class="pt-2 flex gap-3 items-center">
			<Button type="button" variant="secondary" onclick={saveClientProfile} disabled={saveLoading}>
				{#if saveLoading}Saving...{:else}Save Client{/if}
			</Button>
			{#if selectedClientId}
				<Button
					type="button"
					variant="destructive"
					onclick={handleDeleteClient}
					disabled={deleteLoading}
				>
					{#if deleteLoading}Deleting...{:else}Delete Client{/if}
				</Button>
			{/if}
			{#if saveMessage}
				<span class="text-sm text-muted-foreground">{saveMessage}</span>
			{/if}
		</div>
	{/if}
</div>
