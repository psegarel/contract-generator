<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { contractSchema, type ContractData } from '$lib/schemas/contract';
	import { generateServiceContract } from '$lib/utils/serviceContractGenerator';
	import { saveContract } from '$lib/utils/contracts';
	import { getServiceContractById, updateServiceContract } from '$lib/utils/serviceContracts';
	import { companyConfig } from '$lib/config/company';
	import { authState } from '$lib/state/auth.svelte';
	import { LoaderCircle, Save, FileText } from 'lucide-svelte';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import ClientForm from '$lib/components/ClientForm.svelte';
	import LocationForm from '$lib/components/LocationForm.svelte';
	import type { ClientData as ClientProfile } from '$lib/utils/clients';
	import { getLocation, type Location } from '$lib/utils/locations';

	let formData: ContractData = $state({
		clientName: '',
		clientEmail: '',
		clientAddress: '',
		clientPhone: '',
		clientIdDocument: '',
		clientTaxId: '',
		jobName: '',
		eventName: '',
		numberOfPerformances: 1,
		eventLocation: '',
		firstPerformanceTime: '',
		jobContent: '',
		bankName: '',
		accountNumber: '',
		netFee: 0,
		taxRate: 10, // Default 10%
		startDate: '',
		endDate: ''
	});

	let errors: Partial<Record<keyof ContractData, string>> = $state({});
	let isGenerating = $state(false);
	let isSavingDraft = $state(false);
	let taxRateStr = $state('10');
	let editContractId = $state<string | null>(null);
	let isLoadingContract = $state(false);
	let selectedClientId = $state<string>('');
	let selectedLocationId = $state<string>('');
	let loadedLocationData = $state<Location | null>(null);

	// Derive formData.taxRate from taxRateStr (read-only computed property)
	let derivedTaxRate = $derived(Number(taxRateStr));

	onMount(async () => {
		const editId = $page.url.searchParams.get('edit');
		if (editId) {
			editContractId = editId;
			isLoadingContract = true;
			try {
				const contract = await getServiceContractById(editId);
				if (contract) {
					formData = { ...contract.contractData };
					taxRateStr = String(contract.contractData.taxRate);
					selectedLocationId = contract.locationId;

					// Load full location data
					if (contract.locationId) {
						const location = await getLocation(contract.locationId);
						if (location) {
							loadedLocationData = {
								name: location.name,
								address: location.address,
								contactPerson: location.contactPerson || null,
								contactEmail: location.contactEmail || null,
								contactPhone: location.contactPhone || null
							};
						}
					}
				} else {
					toast.error('Contract not found');
					goto('/contracts/service');
				}
			} catch (error) {
				console.error('Error loading contract:', error);
				toast.error('Failed to load contract');
				goto('/contracts/service');
			} finally {
				isLoadingContract = false;
			}
		}
	});

	function handleClientChange(clientData: ClientProfile | null, clientId?: string) {
		if (clientData) {
			formData.clientName = clientData.name;
			formData.clientEmail = clientData.email;
			formData.clientPhone = clientData.phone;
			formData.clientAddress = clientData.address;
			formData.clientIdDocument = clientData.idDocument;
			formData.clientTaxId = clientData.taxId || '';
			formData.bankName = clientData.bankName || '';
			formData.accountNumber = clientData.accountNumber || '';
			// Store the client ID for when we save the contract
			selectedClientId = clientId || '';
		}
	}

	function handleLocationChange(locationData: Location | null, locationId?: string) {
		if (locationData) {
			formData.eventLocation = locationData.name;
			// Store the location ID for when we save the contract
			selectedLocationId = locationId || '';
		}
	}

	// Derived values for display
	let grossFee = $derived(
		formData.netFee && derivedTaxRate
			? Math.round(formData.netFee / (1 - derivedTaxRate / 100))
			: 0
	);
	let taxAmount = $derived(grossFee - formData.netFee);

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
	};

	const validate = () => {
		const result = contractSchema.safeParse(formData);
		if (!result.success) {
			const fieldErrors = result.error.flatten().fieldErrors;
			errors = Object.fromEntries(
				Object.entries(fieldErrors).map(([key, val]) => [key, val?.[0] || ''])
			) as Partial<Record<keyof ContractData, string>>;
			return false;
		}
		errors = {};
		return true;
	};

	const handleSaveDraft = async () => {
		// Skip validation for drafts - they can be incomplete

		// Sync formData.taxRate from derivedTaxRate before saving
		formData.taxRate = derivedTaxRate;

		isSavingDraft = true;
		try {
			// Update existing contract
			if (editContractId) {
				await updateServiceContract(editContractId, formData);
				toast.success('Draft updated successfully!');
				goto('/contracts/service/list');
				return;
			}

			// Save new contract as draft (without generating DOCX)
			if (!authState.user?.uid) {
				toast.error('You must be signed in to save drafts');
				return;
			}

			if (!selectedLocationId) {
				toast.error('Please select a location before saving');
				return;
			}

			// Generate contract number
			const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
			const initials = formData.clientName
				.split(' ')
				.map((n) => n[0])
				.join('')
				.toUpperCase();
			const timestamp = Date.now().toString().slice(-3);
			const contractNumber = `${dateStr}-${initials}-${timestamp}`;

			await saveContract(
				authState.user.uid,
				'service',
				formData,
				contractNumber,
				selectedLocationId,
				'draft'
			);

			toast.success('Draft saved successfully!');
			goto('/contracts/service/list');
		} catch (error) {
			console.error('Error saving draft:', error);
			toast.error('Failed to save draft. Please try again.');
		} finally {
			isSavingDraft = false;
		}
	};

	const handleSubmit = async () => {
		if (!validate()) return;

		// Sync formData.taxRate from derivedTaxRate before saving
		formData.taxRate = derivedTaxRate;

		isGenerating = true;
		try{
			// Update existing contract
			if (editContractId) {
				try {
					await updateServiceContract(editContractId, formData);
					toast.success('Contract updated successfully!');
					goto('/contracts/service/list');
					return;
				} catch (updateError) {
					console.error('Error updating contract:', updateError);
					toast.error('Failed to update contract. Please try again.');
					return;
				} finally {
					isGenerating = false;
				}
			}

			// Generate new contract
			const blob = await generateServiceContract(formData);
			const filename = `Contract_${formData.clientName.replace(/\s+/g, '_')}.docx`;

			// Generate contract number (same logic as in serviceContractGenerator)
			const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
			const initials = formData.clientName
				.split(' ')
				.map((n) => n[0])
				.join('')
				.toUpperCase();
			const timestamp = Date.now().toString().slice(-3);
			const contractNumber = `${dateStr}-${initials}-${timestamp}`;

			// Save contract to Firebase
			if (authState.user?.uid && selectedLocationId) {
				try {
					await saveContract(
					authState.user.uid,
					'service',
					formData,
					contractNumber,
					selectedLocationId,
					'generated'
				);
				} catch (saveError) {
					console.error('Error saving contract to database:', saveError);
					// Continue with download even if save fails
				}
			} else if (!selectedLocationId) {
				console.warn('Cannot save contract: no location selected');
			}

			// Try File System Access API (Chrome, Edge, Opera)
			if ('showSaveFilePicker' in window) {
				try {
					// @ts-expect-error - showSaveFilePicker is not yet in standard TS lib
					const handle = await window.showSaveFilePicker({
						suggestedName: filename,
						types: [
							{
								description: 'Word Document',
								accept: {
									'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
										'.docx'
									]
								}
							}
						]
					});
					const writable = await handle.createWritable();
					await writable.write(blob);
					await writable.close();
					return;
				} catch (err) {
					// User cancelled or API failed, fall back if not cancelled
					if (err instanceof Error && err.name !== 'AbortError') {
						console.error('File Picker Error:', err);
					} else if (err && typeof err === 'object' && 'name' in err && err.name === 'AbortError') {
						return; // User cancelled, don't fallback
					}
				}
			}

			// Fallback: Native download method
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
		} catch (error) {
			console.error('Error generating contract:', error);
			toast.error('Failed to generate contract. Please try again.');
		} finally {
			isGenerating = false;
		}
	};
</script>

<div>
	{#if isLoadingContract}
		<div class="flex justify-center items-center py-12">
			<LoaderCircle class="w-8 h-8 animate-spin text-primary" />
			<span class="ml-3 text-muted-foreground">Loading contract...</span>
		</div>
	{:else}
		<form
			novalidate
			onsubmit={(e) => {
				e.preventDefault();
				handleSubmit();
			}}
			class="space-y-8"
		>
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-12 items-start">
			<!-- Left Column: Identity & Location -->
			<div class="space-y-12">
				<!-- Contact Information Section -->
				<div class="space-y-8">
					<h3 class="text-xl font-bold tracking-tight text-foreground">
						Contact Information
					</h3>
					<ClientForm
						showActions={true}
						entityTitle="Contact"
						onClientChange={handleClientChange}
						initialData={editContractId
							? {
									name: formData.clientName,
									email: formData.clientEmail,
									phone: formData.clientPhone,
									address: formData.clientAddress,
									idDocument: formData.clientIdDocument,
									taxId: formData.clientTaxId || null,
									bankName: formData.bankName || null,
									accountNumber: formData.accountNumber || null
								}
							: undefined}
					/>
					{#if errors.clientName}
						<p class="text-red-600 dark:text-red-400 text-xs mt-1">{errors.clientName}</p>
					{/if}
				</div>

				<!-- Location Information Section -->
				<div class="space-y-8">
					<h3 class="text-xl font-bold tracking-tight text-foreground">
						Location Information
					</h3>
					<LocationForm
						showActions={true}
						onLocationChange={handleLocationChange}
						initialData={editContractId && loadedLocationData ? loadedLocationData : undefined}
					/>
					{#if errors.eventLocation}
						<p class="text-red-600 dark:text-red-400 text-xs mt-1">{errors.eventLocation}</p>
					{/if}
				</div>
			</div>

			<!-- Right Column: Event, Finance & Timeline -->
			<div class="space-y-12">
				<!-- Event Details Section (Cardified) -->
				<div class="p-10 rounded-[2.5rem] space-y-8" style="background-color: oklch(0.96 0.02 230);">
					<h3 class="text-xl font-bold tracking-tight text-foreground">
						Event Details
					</h3>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
						<!-- Job Name -->
						<div class="space-y-2.5">
							<label for="jobName" class="text-xs font-bold uppercase tracking-tight text-muted-foreground ml-1"
								>Job Name</label
							>
							<input
								type="text"
								id="jobName"
								bind:value={formData.jobName}
								class="w-full px-4 py-3 bg-background rounded-2xl text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all border-none"
								placeholder="e.g., MC, Performer"
							/>
							{#if errors.jobName}
								<p class="text-red-600 dark:text-red-400 text-xs mt-1">{errors.jobName}</p>
							{/if}
						</div>

						<!-- Event Name -->
						<div class="space-y-2.5">
							<label for="eventName" class="text-xs font-bold uppercase tracking-tight text-muted-foreground ml-1"
								>Event Name</label
							>
							<input
								type="text"
								id="eventName"
								bind:value={formData.eventName}
								class="w-full px-4 py-3 bg-background rounded-2xl text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all border-none"
								placeholder="Event name"
							/>
							{#if errors.eventName}
								<p class="text-red-600 dark:text-red-400 text-xs mt-1">{errors.eventName}</p>
							{/if}
						</div>

						<!-- Number of Performances -->
						<div class="space-y-2.5">
							<label
								for="numberOfPerformances"
								class="text-xs font-bold uppercase tracking-tight text-muted-foreground ml-1"
								>Number of Performances</label
							>
							<input
								type="number"
								id="numberOfPerformances"
								bind:value={formData.numberOfPerformances}
								min="1"
								class="w-full px-4 py-3 bg-background rounded-2xl text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all border-none"
							/>
							{#if errors.numberOfPerformances}
								<p class="text-red-600 dark:text-red-400 text-xs mt-1">{errors.numberOfPerformances}</p>
							{/if}
						</div>

						<!-- Event Location -->
						<div class="space-y-2.5">
							<label
								for="eventLocation"
								class="text-xs font-bold uppercase tracking-tight text-muted-foreground ml-1">Event Location</label
							>
							<input
								type="text"
								id="eventLocation"
								bind:value={formData.eventLocation}
								class="w-full px-4 py-3 bg-background rounded-2xl text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all border-none"
								placeholder="Venue name"
							/>
							{#if errors.eventLocation}
								<p class="text-red-600 dark:text-red-400 text-xs mt-1">{errors.eventLocation}</p>
							{/if}
						</div>

						<!-- Performance Time -->
						<div class="space-y-2.5">
							<label
								for="firstPerformanceTime"
								class="text-xs font-bold uppercase tracking-tight text-muted-foreground ml-1"
								>Performance Time</label
							>
							<input
								type="text"
								id="firstPerformanceTime"
								bind:value={formData.firstPerformanceTime}
								class="w-full px-4 py-3 bg-background rounded-2xl text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all border-none"
								placeholder="e.g., 7:00 PM"
							/>
							{#if errors.firstPerformanceTime}
								<p class="text-red-600 dark:text-red-400 text-xs mt-1">{errors.firstPerformanceTime}</p>
							{/if}
						</div>
					</div>

					<!-- Job Content -->
					<div class="space-y-2.5">
						<label for="jobContent" class="text-xs font-bold uppercase tracking-tight text-muted-foreground ml-1"
							>Job Content</label
						>
						<textarea
							id="jobContent"
							bind:value={formData.jobContent}
							rows="3"
							class="w-full px-4 py-3 bg-background rounded-2xl text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all border-none"
							placeholder="Describe the job responsibilities..."
						></textarea>
						{#if errors.jobContent}
							<p class="text-red-600 dark:text-red-400 text-xs mt-1">{errors.jobContent}</p>
						{/if}
					</div>
				</div>

				<!-- Financial Details Section (Cardified) -->
				<div class="p-10 rounded-[2.5rem] space-y-8" style="background-color: oklch(0.96 0.02 150);">
					<h3 class="text-xl font-bold tracking-tight text-foreground">
						Financial Details
					</h3>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
						<!-- Net Fee -->
						<div class="space-y-2.5">
							<Label class="text-xs font-bold uppercase tracking-tight text-muted-foreground ml-1">Net Service Fee (VND)</Label>
							<Input id="netFee" type="number" bind:value={formData.netFee} min="0" class="bg-background rounded-2xl border-none h-12" />
							{#if errors.netFee}
								<p class="text-red-600 dark:text-red-400 text-xs mt-1">{errors.netFee}</p>
							{/if}
						</div>

						<!-- Tax Rate -->
						<div class="space-y-2.5">
							<Label class="text-xs font-bold uppercase tracking-tight text-muted-foreground ml-1">PIT Tax Rate (%)</Label>
							<Select type="single" bind:value={taxRateStr}>
								<SelectTrigger class="w-full bg-background rounded-2xl border-none h-12">
									<span data-slot="select-value">{taxRateStr ? `${taxRateStr}%` : 'Select rate'}</span>
								</SelectTrigger>
								<SelectContent>
									{#each companyConfig.taxRates as rate (rate)}
										<SelectItem value={String(rate)}>{rate}%</SelectItem>
									{/each}
								</SelectContent>
							</Select>
							{#if errors.taxRate}
								<p class="text-red-600 dark:text-red-400 text-xs mt-1">{errors.taxRate}</p>
							{/if}
						</div>
					</div>

					<!-- Calculation Preview -->
					<div class="p-8 bg-background rounded-[2rem] space-y-3 text-sm">
						<div class="flex justify-between text-muted-foreground">
							<span class="font-medium">Net Fee (Paid to Staff)</span>
							<span class="font-bold text-foreground">{formatCurrency(formData.netFee)}</span>
						</div>
						<div class="flex justify-between text-muted-foreground border-b border-foreground/5 pb-3">
							<span class="font-medium">Tax Amount ({derivedTaxRate}%)</span>
							<span class="font-bold text-foreground">{formatCurrency(taxAmount)}</span>
						</div>
						<div class="flex justify-between pt-3 font-black text-foreground text-lg">
							<span>Total Gross Fee</span>
							<span class="text-primary">{formatCurrency(grossFee)}</span>
						</div>
					</div>
				</div>

				<!-- Contract Period Section (Cardified) -->
				<div class="p-10 rounded-[2.5rem] space-y-8" style="background-color: oklch(0.92 0.005 280);">
					<h3 class="text-xl font-bold tracking-tight text-foreground">
						Contract Period
					</h3>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
						<!-- Start Date -->
						<div class="space-y-2.5">
							<Label class="text-xs font-bold uppercase tracking-tight text-muted-foreground ml-1">Start Date</Label>
							<Input id="startDate" type="date" bind:value={formData.startDate} class="bg-background rounded-2xl border-none h-12" />
							{#if errors.startDate}
								<p class="text-red-600 dark:text-red-400 text-xs mt-1">{errors.startDate}</p>
							{/if}
						</div>

						<!-- End Date -->
						<div class="space-y-2.5">
							<Label class="text-xs font-bold uppercase tracking-tight text-muted-foreground ml-1">End Date</Label>
							<Input id="endDate" type="date" bind:value={formData.endDate} class="bg-background rounded-2xl border-none h-12" />
							{#if errors.endDate}
								<p class="text-red-600 dark:text-red-400 text-xs mt-1">{errors.endDate}</p>
							{/if}
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="pt-12 border-t border-foreground/5 flex justify-end">
			<Button type="submit" disabled={isGenerating} class="text-white h-12 rounded-2xl font-bold text-base hover:scale-[1.01] active:scale-[0.99] transition-all px-8" style="background-color: oklch(0.3 0.01 280);" size="lg">
				{#if isGenerating}
					<LoaderCircle class="w-6 h-6 mr-2 animate-spin" />
					{editContractId ? 'Updating...' : 'Generating...'}
				{:else}
					<FileText class="w-6 h-6 mr-2" />
					{editContractId ? 'Update Contract' : 'Generate Contract'}
				{/if}
			</Button>
		</div>
		</form>
	{/if}
</div>
