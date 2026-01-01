<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { authStore } from '$lib/stores/auth.svelte';
	import { generateServiceContract } from '$lib/utils/serviceContractGenerator';
	import { generateEventPlanningContract } from '$lib/utils/eventPlanningContractGenerator';
	import { updatePaymentStatus, type SavedContract } from '$lib/utils/contracts';
	import { Download, Pencil, DollarSign, MapPin, User, Calendar } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';

	interface Props {
		contracts: SavedContract[];
		showLocationLink?: boolean;
		onContractsUpdate?: (contracts: SavedContract[]) => void;
	}

	let { contracts = [], showLocationLink = false, onContractsUpdate }: Props = $props();

	let downloadingIds = $state<Set<string>>(new Set());
	let updatingPaymentIds = $state<Set<string>>(new Set());

	// Type guards for discriminated union
	type ServiceContract = SavedContract & { type: 'service' };
	type EventPlanningContract = SavedContract & { type: 'event-planning' };

	function isServiceContract(contract: SavedContract): contract is ServiceContract {
		return contract.type === 'service';
	}

	function isEventPlanningContract(contract: SavedContract): contract is EventPlanningContract {
		return contract.type === 'event-planning';
	}

	function formatDateString(dateString: string): string {
		if (!dateString) return 'N/A';
		const date = new Date(dateString);
		return new Intl.DateTimeFormat('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		}).format(date);
	}

	// Helper functions to get display data based on contract type
	function getContractTitle(contract: SavedContract): string {
		return contract.contractData.eventName;
	}

	function getContractDate(contract: SavedContract): string {
		if (isServiceContract(contract)) {
			return contract.contractData.startDate;
		}
		return contract.contractData.eventDate;
	}

	function getContractLocation(contract: SavedContract): string {
		if (isServiceContract(contract)) {
			return contract.contractData.eventLocation;
		}
		return contract.contractData.eventVenue;
	}

	function getContractClient(contract: SavedContract): string {
		if (isServiceContract(contract)) {
			return contract.contractData.clientName;
		}
		return contract.contractData.clientCompany;
	}

	function getEditUrl(contract: SavedContract): string {
		if (isServiceContract(contract)) {
			return `/contracts/service-contract?edit=${contract.id}`;
		}
		return `/contracts/event-planning?edit=${contract.id}`;
	}

	async function handleDownload(contract: SavedContract) {
		downloadingIds.add(contract.id);

		try {
			// Generate contract based on type
			let blob: Blob;
			let filename: string;

			if (isServiceContract(contract)) {
				blob = await generateServiceContract(contract.contractData);
				filename = `Contract_${contract.contractData.clientName.replace(/\s+/g, '_')}.docx`;
			} else {
				blob = await generateEventPlanningContract(contract.contractData);
				filename = `EventPlanning_${contract.contractData.clientCompany.replace(/\s+/g, '_')}.docx`;
			}

			// Try File System Access API
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
					if (err && typeof err === 'object' && 'name' in err && err.name === 'AbortError') {
						return;
					}
				}
			}

			// Fallback download
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
			toast.success('Contract downloaded successfully!');
		} catch (error) {
			console.error('Error downloading contract:', error);
			toast.error('Failed to download contract. Please try again.');
		} finally {
			downloadingIds.delete(contract.id);
		}
	}

	async function togglePaymentStatus(contract: SavedContract) {
		if (!authStore.user?.uid || !authStore.isAdmin) {
			toast.error('Only admins can update payment status');
			return;
		}

		updatingPaymentIds.add(contract.id);

		try {
			const newStatus: 'unpaid' | 'paid' = contract.paymentStatus === 'paid' ? 'unpaid' : 'paid';
			await updatePaymentStatus(contract.id, newStatus, authStore.user.uid);

			// Update local state and notify parent
			const updatedContracts = contracts.map((c) =>
				c.id === contract.id
					? {
							...c,
							paymentStatus: newStatus,
							paidAt: (newStatus === 'paid' ? new Date() : null) as any,
							paidBy: newStatus === 'paid' ? authStore.user!.uid : null
						}
					: c
			);

			if (onContractsUpdate) {
				onContractsUpdate(updatedContracts);
			}

			toast.success(`Payment status updated to ${newStatus}`);
		} catch (error) {
			console.error('Error updating payment status:', error);
			toast.error('Failed to update payment status');
		} finally {
			updatingPaymentIds.delete(contract.id);
		}
	}
</script>

<div>
	{#each contracts as contract (contract.id)}
		<div class="py-6 border-b border-dotted border-border">
			<!-- Mobile: Stacked Layout -->
			<div class="md:hidden space-y-3">
				<!-- Title and Badge -->
				<div class="flex items-start justify-between gap-2">
					<h3 class="text-lg font-semibold leading-tight flex-1">
						{getContractTitle(contract)}
					</h3>
					{#if contract.paymentStatus === 'paid'}
						<Badge variant="default" class="bg-emerald-500 hover:bg-emerald-600 shrink-0"
							>Paid</Badge
						>
					{:else}
						<Badge variant="secondary" class="shrink-0">Unpaid</Badge>
					{/if}
				</div>

				<!-- Details -->
				<div class="space-y-1.5 text-sm text-muted-foreground">
					<div class="flex items-center gap-2">
						<Calendar class="h-3.5 w-3.5 shrink-0" />
						<span>{formatDateString(getContractDate(contract))}</span>
					</div>
					<div class="flex items-center gap-2">
						<MapPin class="h-3.5 w-3.5 shrink-0" />
						<span>{getContractLocation(contract)}</span>
					</div>
					<div class="flex items-center gap-2">
						<User class="h-3.5 w-3.5 shrink-0" />
						<span>{getContractClient(contract)}</span>
					</div>
					{#if showLocationLink && contract.locationId}
						<div class="pt-1">
							<a
								href="/contracts/{contract.locationId}/list"
								class="text-primary hover:underline text-sm"
							>
								View all at this location →
							</a>
						</div>
					{/if}
				</div>

				<!-- Actions -->
				<div class="flex flex-wrap gap-2 pt-1">
					<Button size="sm" href={getEditUrl(contract)} class="flex-1 min-w-[100px]">
						<Pencil class="h-3.5 w-3.5 mr-1.5" />
						Edit
					</Button>
					<Button
						variant="outline"
						size="sm"
						onclick={() => handleDownload(contract)}
						disabled={downloadingIds.has(contract.id)}
						class="flex-1 min-w-[100px]"
					>
						{#if downloadingIds.has(contract.id)}
							<span class="animate-spin mr-1.5">⏳</span>
							...
						{:else}
							<Download class="h-3.5 w-3.5 mr-1.5" />
							Download
						{/if}
					</Button>
					{#if authStore.isAdmin}
						<Button
							variant="outline"
							size="sm"
							onclick={() => togglePaymentStatus(contract)}
							disabled={updatingPaymentIds.has(contract.id)}
							class="w-full"
						>
							{#if updatingPaymentIds.has(contract.id)}
								<span class="animate-spin mr-1.5">⏳</span>
								Updating...
							{:else}
								<DollarSign class="h-3.5 w-3.5 mr-1.5" />
								{contract.paymentStatus === 'paid' ? 'Mark Unpaid' : 'Mark Paid'}
							{/if}
						</Button>
					{/if}
				</div>
			</div>

			<!-- Desktop: Horizontal Layout -->
			<div class="hidden md:flex items-start justify-between gap-4">
				<div class="flex-1 min-w-0">
					<div class="flex items-center gap-3 mb-2">
						<h3 class="text-lg font-semibold">
							{getContractTitle(contract)}
						</h3>
						{#if contract.paymentStatus === 'paid'}
							<Badge variant="default" class="bg-emerald-500 hover:bg-emerald-600">Paid</Badge>
						{:else}
							<Badge variant="secondary">Unpaid</Badge>
						{/if}
					</div>
					<div class="text-lg text-muted-foreground mb-2">
						{formatDateString(getContractDate(contract))}
					</div>
					<div class="space-y-1 text-sm text-muted-foreground">
						<div>{getContractLocation(contract)}</div>
						<div>{getContractClient(contract)}</div>
						{#if showLocationLink && contract.locationId}
							<div>
								<a
									href="/contracts/{contract.locationId}/list"
									class="text-primary hover:underline"
								>
									View all contracts at {getContractLocation(contract)}
								</a>
							</div>
						{/if}
					</div>
				</div>

				<div class="flex gap-2 shrink-0">
					{#if authStore.isAdmin}
						<Button
							variant="outline"
							size="sm"
							onclick={() => togglePaymentStatus(contract)}
							disabled={updatingPaymentIds.has(contract.id)}
						>
							{#if updatingPaymentIds.has(contract.id)}
								<span class="flex items-center space-x-2">
									<span class="animate-spin">⏳</span>
									<span>Updating...</span>
								</span>
							{:else}
								<span class="flex items-center space-x-2">
									<DollarSign class="h-4 w-4" />
									<span>{contract.paymentStatus === 'paid' ? 'Mark Unpaid' : 'Mark Paid'}</span>
								</span>
							{/if}
						</Button>
					{/if}
					<Button size="sm" href={getEditUrl(contract)}>
						<span class="flex items-center space-x-2">
							<Pencil class="h-4 w-4" />
							<span>Edit</span>
						</span>
					</Button>
					<Button
						variant="outline"
						size="sm"
						onclick={() => handleDownload(contract)}
						disabled={downloadingIds.has(contract.id)}
					>
						{#if downloadingIds.has(contract.id)}
							<span class="flex items-center space-x-2">
								<span class="animate-spin">⏳</span>
								<span>Downloading...</span>
							</span>
						{:else}
							<span class="flex items-center space-x-2">
								<Download class="h-4 w-4" />
								<span>Download</span>
							</span>
						{/if}
					</Button>
				</div>
			</div>
		</div>
	{/each}
</div>
