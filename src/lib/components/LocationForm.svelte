<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import { authState } from '$lib/state/auth.svelte';
	import { toast } from 'svelte-sonner';
	import { Search, LoaderCircle, Trash2, MapPin, Save } from 'lucide-svelte';
	import {
		listLocations,
		getLocation,
		upsertLocation,
		deleteLocation,
		type Location
	} from '$lib/utils/locations';
	import { onMount } from 'svelte';

	interface Props {
		/** Callback when location data changes */
		onLocationChange?: (data: Location | null, locationId?: string) => void;
		/** Show save/delete buttons (for standalone location management) */
		showActions?: boolean;
		/** Initial location data to populate the form */
		initialData?: Location;
	}

	const props: Props = $props();

	// Helper to get initial form data without capturing reactive prop reference
	function createInitialFormData(data: Location | undefined): Location {
		if (!data) {
			return {
				name: '',
				address: '',
				contactPerson: null,
				contactEmail: null,
				contactPhone: null
			};
		}
		return {
			name: data.name || '',
			address: data.address || '',
			contactPerson: data.contactPerson || null,
			contactEmail: data.contactEmail || null,
			contactPhone: data.contactPhone || null
		};
	}

	let locations = $state<{ id: string; name: string }[]>([]);
	let selectedLocationId = $state('');
	let saveLoading = $state(false);
	let deleteLoading = $state(false);
	let saveMessage = $state('');
	let searchQuery = $state('');
	let showDropdown = $state(false);
	// Pre-generate ID for new locations
	let locationId = $state<string>(crypto.randomUUID());

	// Filtered locations based on search query
	let filteredLocations = $derived(
		searchQuery
			? locations.filter((l) => l.name.toLowerCase().includes(searchQuery.toLowerCase()))
			: locations
	);

	// Initialize formData from initialData (one-time initialization via function)
	let formData = $state<Location>(createInitialFormData(props.initialData));

	// Helper to notify parent component of changes (event-based, not reactive)
	function notifyParent() {
		props.onLocationChange?.(formData, selectedLocationId || locationId);
	}

	onMount(async () => {
		if (authState.isAuthenticated) {
			try {
				locations = await listLocations();
			} catch (e) {
				console.error('Load locations error:', e);
			}
		}
	});

	async function handleLocationSelect(id: string) {
		if (!id) return;
		selectedLocationId = id;
		locationId = id; // Use existing location's ID
		const selectedLocation = locations.find((l) => l.id === id);
		searchQuery = selectedLocation?.name || '';
		showDropdown = false;
		try {
			const profile = await getLocation(id);
			if (profile) {
				formData.name = profile.name;
				formData.address = profile.address;
				formData.contactPerson = profile.contactPerson || null;
				formData.contactEmail = profile.contactEmail || null;
				formData.contactPhone = profile.contactPhone || null;

				// Notify parent after location selection
				notifyParent();
			}
		} catch (e) {
			console.error('Fetch location error:', e);
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
		selectedLocationId = '';
		locationId = crypto.randomUUID(); // Generate new ID for new location
		showDropdown = false;

		// Notify parent that location selection was cleared
		props.onLocationChange?.(null, '');
	}

	async function saveLocationProfile() {
		if (!authState.user) {
			toast.error('You must be signed in to save locations.');
			return;
		}
		saveLoading = true;
		saveMessage = '';
		try {
			// Use pre-generated locationId for new locations, or selectedLocationId for updates
			const idToUse = selectedLocationId || locationId;
			const id = await upsertLocation(authState.user.uid, formData, idToUse);
			toast.success('Location saved successfully!');
			locations = await listLocations();
			selectedLocationId = id;
			locationId = id; // Update locationId to the saved ID

			// Notify parent after successful save
			notifyParent();

			// Generate new ID for next location
			if (!selectedLocationId) {
				locationId = crypto.randomUUID();
			}
		} catch (e) {
			console.error('Save location error:', e);
			const errorMessage = e instanceof Error ? e.message : 'Failed to save location.';
			toast.error(errorMessage);
		} finally {
			saveLoading = false;
		}
	}

	async function handleDeleteLocation() {
		if (!selectedLocationId) return;
		if (!confirm('Are you sure you want to delete this location?')) return;

		deleteLoading = true;
		try {
			const success = await deleteLocation(selectedLocationId);
			if (success) {
				selectedLocationId = '';
				locationId = crypto.randomUUID(); // Generate new ID for next location
				formData = {
					name: '',
					address: '',
					contactPerson: null,
					contactEmail: null,
					contactPhone: null
				};
				locations = await listLocations();
				toast.success('Location deleted successfully!');

				// Notify parent that location was deleted
				props.onLocationChange?.(null, '');
			} else {
				toast.error('Failed to delete location.');
			}
		} catch (e) {
			console.error('Delete location error:', e);
			toast.error('Failed to delete location.');
		} finally {
			deleteLoading = false;
		}
	}

	// Removed problematic $effect that called handleLocationSelect
	// Selection is handled via user interaction in the dropdown
</script>

<div class="space-y-8">
	<!-- Location Selector with Search -->
	<div class="space-y-2.5">
		<Label class="text-xs font-bold uppercase tracking-tight text-muted-foreground ml-1">Event Location</Label>
		<div class="relative">
			<Input
				id="locationSearch"
				type="text"
				bind:value={searchQuery}
				onfocus={handleSearchFocus}
				onblur={handleSearchBlur}
				placeholder="Search or select a location..."
				class="bg-background rounded-2xl border-none h-12 pl-12"
			/>
			<MapPin class="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
			
			{#if showDropdown && filteredLocations.length > 0}
				<div
					class="absolute z-10 w-full mt-2 bg-secondary rounded-2xl shadow-none border-none overflow-hidden"
				>
					{#each filteredLocations as location (location.id)}
						<button
							type="button"
							class="w-full text-left px-4 py-3 hover:bg-black/5 text-sm transition-colors"
							onclick={() => handleLocationSelect(location.id)}
						>
							<div class="font-bold">{location.name}</div>
						</button>
					{/each}
				</div>
			{:else if showDropdown && searchQuery && filteredLocations.length === 0}
				<div
					class="absolute z-10 w-full mt-2 bg-secondary rounded-2xl shadow-none border-none px-4 py-3 text-muted-foreground text-xs font-bold uppercase tracking-widest"
				>
					No locations found
				</div>
			{/if}
		</div>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
		<!-- Location Name -->
		<div class="space-y-2.5">
			<Label class="text-xs font-bold uppercase tracking-tight text-muted-foreground ml-1">Location Name *</Label>
			<Input
				id="locationName"
				type="text"
				bind:value={formData.name}
				placeholder="ABC Nightclub"
				class="bg-background rounded-2xl border-none h-12"
				required
			/>
		</div>

		<!-- Address -->
		<div class="space-y-2.5">
			<Label class="text-xs font-bold uppercase tracking-tight text-muted-foreground ml-1">Address *</Label>
			<Input
				id="locationAddress"
				type="text"
				bind:value={formData.address}
				placeholder="123 Main St, City, Country"
				class="bg-background rounded-2xl border-none h-12"
				required
			/>
		</div>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
		<!-- Contact Person -->
		<div class="space-y-2.5">
			<Label class="text-xs font-bold uppercase tracking-tight text-muted-foreground ml-1">Contact Person (Optional)</Label>
			<Input
				id="contactPerson"
				type="text"
				bind:value={formData.contactPerson}
				placeholder="John Doe"
				class="bg-background rounded-2xl border-none h-12"
			/>
		</div>

		<!-- Contact Email -->
		<div class="space-y-2.5">
			<Label class="text-xs font-bold uppercase tracking-tight text-muted-foreground ml-1">Contact Email (Optional)</Label>
			<Input
				id="contactEmail"
				type="email"
				bind:value={formData.contactEmail}
				placeholder="contact@location.com"
				class="bg-background rounded-2xl border-none h-12"
			/>
		</div>

		<!-- Contact Phone -->
		<div class="space-y-2.5">
			<Label class="text-xs font-bold uppercase tracking-tight text-muted-foreground ml-1">Contact Phone (Optional)</Label>
			<Input
				id="contactPhone"
				type="tel"
				bind:value={formData.contactPhone}
				placeholder="+1 234 567 890"
				class="bg-background rounded-2xl border-none h-12"
			/>
		</div>
	</div>

	<!-- Action Buttons (only shown if showActions is true) -->
	{#if props.showActions}
		<div class="pt-6 flex gap-4 justify-end">
			<Button
				type="button"
				variant="secondary"
				onclick={saveLocationProfile}
				disabled={saveLoading}
				class="h-12 rounded-2xl font-bold bg-primary text-primary-foreground hover:scale-[1.02] active:scale-[0.98] transition-all shadow-none border-none px-6"
			>
				{#if saveLoading}
					<LoaderCircle class="w-4 h-4 mr-2 animate-spin" />
					Saving...
				{:else}
					<Save class="w-4 h-4 mr-2" />
					Save Location
				{/if}
			</Button>

			{#if selectedLocationId}
				<Button
					type="button"
					variant="ghost"
					onclick={handleDeleteLocation}
					disabled={deleteLoading}
					class="h-12 rounded-2xl font-bold bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all shadow-none border-none px-6"
				>
					{#if deleteLoading}
						<LoaderCircle class="w-4 h-4 mr-2 animate-spin" />
						Deleting...
					{:else}
						<Trash2 class="w-4 h-4 mr-2" />
						Delete Location
					{/if}
				</Button>
			{/if}
		</div>
	{/if}
</div>
