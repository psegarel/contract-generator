<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import { authState } from '$lib/state/auth.svelte';
	import { toast } from 'svelte-sonner';
	import { Search, LoaderCircle, Trash2, Save } from 'lucide-svelte';
	import {
		listClients,
		getClient,
		upsertClient,
		deleteClient,
		type ClientData
	} from '$lib/utils/clients';
	import { uploadClientDocument, deleteClientDocument } from '$lib/utils/clientDocuments';
	import FileUpload from '$lib/components/FileUpload.svelte';
	import { onMount } from 'svelte';

	interface Props {
		/** Callback when client data changes */
		onClientChange?: (data: ClientData | null, clientId?: string) => void;
		/** Show save/delete buttons (for standalone client management) */
		showActions?: boolean;
		/** Initial client data to populate the form */
		initialData?: ClientData;
		/** Custom title for the entity (e.g., 'Client', 'Service Provider') */
		entityTitle?: string;
		/** Pre-select client by ID */
		clientId?: string;
	}

	const props: Props = $props();

	// Helper to get initial form data without capturing reactive prop reference
	function createInitialFormData(data: ClientData | undefined): ClientData {
		if (!data) {
			return {
				name: '',
				email: '',
				phone: '',
				address: '',
				idDocument: '',
				taxId: null,
				bankName: null,
				accountNumber: null
			};
		}
		return {
			name: data.name || '',
			email: data.email || '',
			phone: data.phone || '',
			address: data.address || '',
			idDocument: data.idDocument || '',
			taxId: data.taxId || null,
			bankName: data.bankName || null,
			accountNumber: data.accountNumber || null
		};
	}

	let clients = $state<{ id: string; name: string; email: string }[]>([]);
	let selectedClientId = $state('');
	let saveLoading = $state(false);
	let deleteLoading = $state(false);
	let saveMessage = $state('');
	let searchQuery = $state('');
	let showDropdown = $state(false);
	let uploadingImage1 = $state(false);
	let uploadingImage2 = $state(false);
	// Pre-generate ID for new clients (will be used for uploads and document creation)
	let clientId = $state<string>(crypto.randomUUID());

	// Filtered clients based on search query
	let filteredClients = $derived(
		searchQuery
			? clients.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
			: clients
	);

	// Initialize formData from initialData (one-time initialization via function)
	let formData = $state<ClientData>(createInitialFormData(props.initialData));

	// Helper to notify parent component of changes (event-based, not reactive)
	function notifyParent() {
		props.onClientChange?.(formData, selectedClientId || clientId);
	}

	onMount(async () => {
		if (authState.isAuthenticated) {
			try {
				clients = await listClients();
				// If a clientId was passed from outside, select it
				if (props.clientId) {
					await handleClientSelect(props.clientId);
				}
			} catch (e) {
				console.error('Load clients error:', e);
			}
		}
	});

	async function handleClientSelect(id: string) {
		if (!id) return;
		selectedClientId = id;
		clientId = id; // Use existing client's ID
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

				// Notify parent after client selection
				notifyParent();
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
		clientId = crypto.randomUUID(); // Generate new ID for new client
		showDropdown = false;

		// Notify parent that client selection was cleared
		props.onClientChange?.(null, '');
	}

	async function saveClientProfile() {
		if (!authState.user) {
			toast.error('You must be signed in to save clients.');
			return;
		}
		saveLoading = true;
		saveMessage = '';
		try {
			// Use pre-generated clientId for new clients, or selectedClientId for updates
			const idToUse = selectedClientId || clientId;
			const id = await upsertClient(authState.user.uid, formData, idToUse);
			toast.success('Client saved successfully!');
			clients = await listClients();
			selectedClientId = id;
			clientId = id; // Update clientId to the saved ID

			// Notify parent after successful save
			notifyParent();

			// Generate new ID for next client
			if (!selectedClientId) {
				clientId = crypto.randomUUID();
			}
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
				clientId = crypto.randomUUID(); // Generate new ID for next client
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

				// Notify parent that client was deleted
				props.onClientChange?.(null, '');
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

	async function handleImage1Upload(file: File) {
		if (!authState.user) {
			toast.error('You must be signed in to upload documents');
			return;
		}

		uploadingImage1 = true;
		try {
			const doc = await uploadClientDocument(clientId, file, 1, authState.user.uid);
			if (!formData.documents) {
				formData.documents = {};
			}
			formData.documents.image1 = doc;
			toast.success('Image 1 uploaded successfully');

			// Save to Firestore if client already exists
			if (selectedClientId) {
				await upsertClient(authState.user.uid, formData, selectedClientId);
			}
		} catch (error) {
			console.error('Upload error:', error);
			toast.error(error instanceof Error ? error.message : 'Failed to upload image');
		} finally {
			uploadingImage1 = false;
		}
	}

	async function handleImage1Delete() {
		try {
			await deleteClientDocument(clientId, 1);
			if (formData.documents) {
				formData.documents.image1 = undefined;
			}
			toast.success('Image 1 deleted');

			// Update Firestore if client already exists
			if (authState.user && selectedClientId) {
				await upsertClient(authState.user.uid, formData, selectedClientId);
			}
		} catch (error) {
			console.error('Delete error:', error);
			toast.error('Failed to delete image');
		}
	}

	async function handleImage2Upload(file: File) {
		if (!authState.user) {
			toast.error('You must be signed in to upload documents');
			return;
		}

		uploadingImage2 = true;
		try {
			const doc = await uploadClientDocument(clientId, file, 2, authState.user.uid);
			if (!formData.documents) {
				formData.documents = {};
			}
			formData.documents.image2 = doc;
			toast.success('Image 2 uploaded successfully');

			// Save to Firestore if client already exists
			if (selectedClientId) {
				await upsertClient(authState.user.uid, formData, selectedClientId);
			}
		} catch (error) {
			console.error('Upload error:', error);
			toast.error(error instanceof Error ? error.message : 'Failed to upload image');
		} finally {
			uploadingImage2 = false;
		}
	}

	async function handleImage2Delete() {
		try {
			await deleteClientDocument(clientId, 2);
			if (formData.documents) {
				formData.documents.image2 = undefined;
			}
			toast.success('Image 2 deleted');

			// Update Firestore if client already exists
			if (authState.user && selectedClientId) {
				await upsertClient(authState.user.uid, formData, selectedClientId);
			}
		} catch (error) {
			console.error('Delete error:', error);
			toast.error('Failed to delete image');
		}
	}

	// Removed problematic $effect that called handleClientSelect
	// Selection is handled via user interaction in the dropdown
</script>

<div class="space-y-8">
	<!-- Client Selector with Search -->
	<div class="space-y-2.5">
		<Label class="text-xs font-bold uppercase tracking-tight text-muted-foreground ml-1">Search {(props.entityTitle || 'Client')}</Label>
		<div class="relative">
			<Input
				id="clientSearch"
				type="text"
				bind:value={searchQuery}
				onfocus={handleSearchFocus}
				onblur={handleSearchBlur}
				placeholder="Search for an existing {(props.entityTitle || 'client')}..."
				class="bg-secondary/50 rounded-2xl border-none h-12 pl-12"
			/>
			<Search class="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
					class="absolute z-50 w-full mt-2 bg-secondary rounded-2xl shadow-lg border-none overflow-hidden"
				>
					{#each filteredClients as client (client.id)}
						<button
							type="button"
							class="w-full text-left px-4 py-3 hover:bg-black/5 text-sm transition-colors"
							onclick={() => handleClientSelect(client.id)}
						>
							<div class="font-bold">{client.name}</div>
							<div class="text-xs text-muted-foreground">{client.email}</div>
						</button>
					{/each}
				</div>
			{:else if showDropdown && searchQuery && filteredClients.length === 0}
				<div
					class="absolute z-10 w-full mt-2 bg-secondary rounded-2xl shadow-none border-none px-4 py-3 text-muted-foreground text-xs font-bold uppercase tracking-widest"
				>
					No {(props.entityTitle || 'Client').toLowerCase()}s found
				</div>
			{/if}
		</div>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
		<!-- Client Name -->
		<div class="space-y-2.5">
			<Label class="text-xs font-bold uppercase tracking-tight text-muted-foreground ml-1">{props.entityTitle || 'Client'} Name *</Label>
			<Input
				id="clientName"
				type="text"
				bind:value={formData.name}
				placeholder="John Doe"
				class="bg-secondary/50 rounded-2xl border-none h-12"
				required
			/>
		</div>

		<!-- Email -->
		<div class="space-y-2.5">
			<Label class="text-xs font-bold uppercase tracking-tight text-muted-foreground ml-1">Email Address *</Label>
			<Input
				id="clientEmail"
				type="email"
				bind:value={formData.email}
				placeholder="john@example.com"
				class="bg-secondary/50 rounded-2xl border-none h-12"
				required
			/>
		</div>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
		<!-- Client Phone -->
		<div class="space-y-2.5">
			<Label class="text-xs font-bold uppercase tracking-tight text-muted-foreground ml-1">Phone Number *</Label>
			<Input
				id="clientPhone"
				type="tel"
				bind:value={formData.phone}
				placeholder="+1 234 567 890"
				class="bg-secondary/50 rounded-2xl border-none h-12"
				required
			/>
		</div>

		<!-- ID Document -->
		<div class="space-y-2.5">
			<Label class="text-xs font-bold uppercase tracking-tight text-muted-foreground ml-1">ID Card / Passport Number *</Label>
			<Input
				id="idDocument"
				type="text"
				bind:value={formData.idDocument}
				placeholder="ID or Passport Number"
				class="bg-secondary/50 rounded-2xl border-none h-12"
				required
			/>
		</div>
	</div>

	<!-- Client Address -->
	<div class="space-y-2.5">
		<Label class="text-xs font-bold uppercase tracking-tight text-muted-foreground ml-1">Address *</Label>
		<Input
			id="clientAddress"
			type="text"
			bind:value={formData.address}
			placeholder="123 Main St, City, Country"
			class="bg-secondary/50 rounded-2xl border-none h-12"
			required
		/>
	</div>

	<!-- Tax ID -->
	<div class="space-y-2.5">
		<Label class="text-xs font-bold uppercase tracking-tight text-muted-foreground ml-1">Tax ID (Optional)</Label>
		<Input id="clientTaxId" type="text" bind:value={formData.taxId} placeholder="Tax Code" class="bg-secondary/50 rounded-2xl border-none h-12" />
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
		<!-- Bank Name -->
		<div class="space-y-2.5">
			<Label class="text-xs font-bold uppercase tracking-tight text-muted-foreground ml-1">Bank Name (Optional)</Label>
			<Input
				id="bankName"
				type="text"
				bind:value={formData.bankName}
				placeholder="Bank Name"
				class="bg-secondary/50 rounded-2xl border-none h-12"
			/>
		</div>

		<!-- Account Number -->
		<div class="space-y-2.5">
			<Label class="text-xs font-bold uppercase tracking-tight text-muted-foreground ml-1">Account Number (Optional)</Label>
			<Input
				id="accountNumber"
				type="text"
				bind:value={formData.accountNumber}
				placeholder="Account Number"
				class="bg-secondary/50 rounded-2xl border-none h-12"
			/>
		</div>
	</div>

	<!-- Document Uploads -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-border">
		<FileUpload
			label="ID Document - Image 1"
			document={formData.documents?.image1}
			onFileSelect={handleImage1Upload}
			onFileDelete={handleImage1Delete}
			uploading={uploadingImage1}
			disabled={saveLoading || deleteLoading}
		/>
		<FileUpload
			label="ID Document - Image 2"
			document={formData.documents?.image2}
			onFileSelect={handleImage2Upload}
			onFileDelete={handleImage2Delete}
			uploading={uploadingImage2}
			disabled={saveLoading || deleteLoading}
		/>
	</div>

	<!-- Action Buttons (only shown if showActions is true) -->
	{#if props.showActions}
		<div class="pt-6 flex gap-4 justify-end">
			<Button
				type="button"
				variant="secondary"
				onclick={saveClientProfile}
				disabled={saveLoading}
				class="h-12 rounded-2xl font-bold bg-primary text-primary-foreground hover:scale-[1.02] active:scale-[0.98] transition-all shadow-none border-none px-6"
			>
				{#if saveLoading}
					<LoaderCircle class="w-4 h-4 mr-2 animate-spin" />
					Saving...
				{:else}
					<Save class="w-4 h-4 mr-2" />
					Save {props.entityTitle || 'Client'}
				{/if}
			</Button>

			{#if selectedClientId}
				<Button
					type="button"
					variant="ghost"
					onclick={handleDeleteClient}
					disabled={deleteLoading}
					class="h-12 rounded-2xl font-bold bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all shadow-none border-none px-6"
				>
					{#if deleteLoading}
						<LoaderCircle class="w-4 h-4 mr-2 animate-spin" />
						Deleting...
					{:else}
						<Trash2 class="w-4 h-4 mr-2" />
						Delete {props.entityTitle || 'Client'}
					{/if}
				</Button>
			{/if}
		</div>
	{/if}
</div>
