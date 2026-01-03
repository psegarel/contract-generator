<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { authState } from '$lib/state/auth.svelte';
	import { generateServiceContract } from '$lib/utils/serviceContractGenerator';
	import {
		updateServiceContractPaymentStatus,
		type SavedServiceContract
	} from '$lib/utils/serviceContracts';
	import ServiceContractListItem from './ServiceContractListItem.svelte';

	interface Props {
		contracts: SavedServiceContract[];
		onContractsUpdate?: (contracts: SavedServiceContract[]) => void;
	}

	let { contracts = [], onContractsUpdate }: Props = $props();

	let downloadingIds = $state<Set<string>>(new Set());
	let updatingPaymentIds = $state<Set<string>>(new Set());

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
		<ServiceContractListItem
			{contract}
			isDownloading={downloadingIds.has(contract.id)}
			isUpdatingPayment={updatingPaymentIds.has(contract.id)}
			showAdminActions={authState.isAdmin}
			onDownload={() => handleDownload(contract)}
			onTogglePayment={() => togglePaymentStatus(contract)}
		/>
	{/each}
</div>
