<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { authState } from '$lib/state/auth.svelte';
	import { generateServiceContract } from '$lib/utils/serviceContractGenerator';
	import {
		updateServiceContractPaymentStatus,
		type SavedServiceContract
	} from '$lib/utils/serviceContracts';
	import { Download, Pencil, DollarSign, MapPin, User, Calendar } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';

	interface Props {
		contracts: SavedServiceContract[];
		onContractsUpdate?: (contracts: SavedServiceContract[]) => void;
	}

	let { contracts = [], onContractsUpdate }: Props = $props();

	let downloadingIds = $state<Set<string>>(new Set());
	let updatingPaymentIds = $state<Set<string>>(new Set());

	function formatDateString(dateString: string): string {
		if (!dateString) return 'N/A';
		const date = new Date(dateString);
		return new Intl.DateTimeFormat('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		}).format(date);
	}

	async function handleDownload(contract: SavedServiceContract) {
		downloadingIds.add(contract.id);

		try {
			const blob = await generateServiceContract(contract.contractData);
			const filename = `Contract_${contract.contractData.clientName.replace(/\s+/g, '_')}.docx`;

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

	async function togglePaymentStatus(contract: SavedServiceContract) {
		if (!authState.user?.uid || !authState.isAdmin) {
			toast.error('Only admins can update payment status');
			return;
		}

		updatingPaymentIds.add(contract.id);

		try {
			const newStatus: 'unpaid' | 'paid' = contract.paymentStatus === 'paid' ? 'unpaid' : 'paid';
			await updateServiceContractPaymentStatus(contract.id, newStatus, authState.user.uid);

			// Update local state and notify parent
			const updatedContracts = contracts.map((c) =>
				c.id === contract.id
					? {
							...c,
							paymentStatus: newStatus,
							paidAt: (newStatus === 'paid' ? new Date() : null) as any,
							paidBy: newStatus === 'paid' ? authState.user!.uid : null
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
				<!-- Title and Badges -->
				<div class="flex items-start justify-between gap-2">
					<h3 class="text-lg font-semibold leading-tight flex-1">
						{contract.contractData.eventName}
					</h3>
					<div class="flex gap-2 shrink-0">
						{#if contract.status === 'draft'}
							<Badge variant="outline" class="border-amber-500 text-amber-600 dark:text-amber-400">
								Draft
							</Badge>
						{/if}
						{#if contract.paymentStatus === 'paid'}
							<Badge variant="default" class="bg-emerald-500 hover:bg-emerald-600">Paid</Badge>
						{:else}
							<Badge variant="secondary">Unpaid</Badge>
						{/if}
					</div>
				</div>

				<!-- Details -->
				<div class="space-y-1.5 text-sm text-muted-foreground">
					<div class="flex items-center gap-2">
						<Calendar class="h-3.5 w-3.5 shrink-0" />
						<span>{formatDateString(contract.contractData.startDate)}</span>
					</div>
					<div class="flex items-center gap-2">
						<MapPin class="h-3.5 w-3.5 shrink-0" />
						<span>{contract.contractData.eventLocation}</span>
					</div>
					<div class="flex items-center gap-2">
						<User class="h-3.5 w-3.5 shrink-0" />
						<span>{contract.contractData.clientName}</span>
					</div>
				</div>

				<!-- Actions -->
				<div class="flex flex-wrap gap-2 pt-1">
					<Button size="sm" href="/contracts/service?edit={contract.id}" class="flex-1 min-w-25">
						<Pencil class="h-3.5 w-3.5 mr-1.5" />
						Edit
					</Button>
					<Button
						variant="outline"
						size="sm"
						onclick={() => handleDownload(contract)}
						disabled={downloadingIds.has(contract.id)}
						class="flex-1 min-w-25"
					>
						{#if downloadingIds.has(contract.id)}
							<span class="animate-spin mr-1.5">⏳</span>
							...
						{:else}
							<Download class="h-3.5 w-3.5 mr-1.5" />
							Download
						{/if}
					</Button>
					{#if authState.isAdmin}
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
							{contract.contractData.eventName}
						</h3>
						{#if contract.status === 'draft'}
							<Badge variant="outline" class="border-amber-500 text-amber-600 dark:text-amber-400">
								Draft
							</Badge>
						{/if}
						{#if contract.paymentStatus === 'paid'}
							<Badge variant="default" class="bg-emerald-500 hover:bg-emerald-600">Paid</Badge>
						{:else}
							<Badge variant="secondary">Unpaid</Badge>
						{/if}
					</div>
					<div class="text-lg text-muted-foreground mb-2">
						{formatDateString(contract.contractData.startDate)}
					</div>
					<div class="space-y-1 text-sm text-muted-foreground">
						<div>{contract.contractData.eventLocation}</div>
						<div>{contract.contractData.clientName}</div>
					</div>
				</div>

				<div class="flex gap-2 shrink-0">
					{#if authState.isAdmin}
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
					<Button size="sm" href="/contracts/service?edit={contract.id}">
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
