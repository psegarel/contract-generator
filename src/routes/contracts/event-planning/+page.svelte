<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	import ContractPageHeader from '$lib/components/ContractPageHeader.svelte';
	import EventPlanningContractForm from '$lib/components/EventPlanningContractForm.svelte';
	import { generateEventPlanningContract } from '$lib/utils/eventPlanningContractGenerator';
	import { saveEventPlanningContract } from '$lib/utils/contracts';
	import { getEventPlanningContractById, updateEventPlanningContract } from '$lib/utils/eventPlanningContracts';
	import { authState } from '$lib/state/auth.svelte';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { LoaderCircle } from 'lucide-svelte';
	import type { EventPlanningContractData } from '$lib/schemas/eventPlanningContract';

	let editContractId = $state<string | null>(null);
	let isLoadingContract = $state(false);
	let initialData = $state<EventPlanningContractData | null>(null);

	onMount(async () => {
		const editId = $page.url.searchParams.get('edit');
		if (editId) {
			editContractId = editId;
			isLoadingContract = true;
			try {
				const contract = await getEventPlanningContractById(editId);
				if (contract) {
					initialData = contract.contractData;
				} else {
					toast.error('Contract not found');
					goto('/contracts/event-planning/list');
				}
			} catch (error) {
				console.error('Error loading contract:', error);
				toast.error('Failed to load contract');
				goto('/contracts/event-planning/list');
			} finally {
				isLoadingContract = false;
			}
		}
	});

	async function handleSubmit(formData: EventPlanningContractData) {
		try {
			// If editing, update the existing contract
			if (editContractId) {
				try {
					await updateEventPlanningContract(editContractId, formData);
					toast.success('Contract updated successfully!');
					goto('/contracts/event-planning/list');
					return;
				} catch (updateError) {
					console.error('Error updating contract:', updateError);
					toast.error('Failed to update contract. Please try again.');
					return;
				}
			}

			// Generate the contract document
			const blob = await generateEventPlanningContract(formData);
			const filename = `EventPlanning_${formData.clientCompany.replace(/\s+/g, '_')}.docx`;

			// Generate contract number
			const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
			const initials = formData.clientCompany
				.split(' ')
				.map((n) => n[0])
				.join('')
				.toUpperCase();
			const timestamp = Date.now().toString().slice(-3);
			const contractNumber = `EP-${dateStr}-${initials}-${timestamp}`;

			// Save contract to Firebase
			if (authState.user?.uid && formData.contractLocation) {
				try {
					await saveEventPlanningContract(
						authState.user.uid,
						formData,
						contractNumber,
						formData.contractLocation
					);
					toast.success('Contract saved successfully!');
				} catch (saveError) {
					console.error('Error saving contract to database:', saveError);
					toast.error('Failed to save contract to database');
					// Continue with download even if save fails
				}
			}

			// Download the file
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
					toast.success('Contract generated successfully!');
					goto('/contracts/event-planning/list');
					return;
				} catch (err) {
					// User cancelled or API failed, fall back if not cancelled
					if (err instanceof Error && err.name !== 'AbortError') {
						console.warn('File System Access API failed, falling back to download:', err);
					} else {
						// User cancelled - don't show error or redirect
						return;
					}
				}
			}

			// Fallback: Standard download
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);

			toast.success('Contract generated successfully!');
			goto('/contracts/event-planning/list');
		} catch (error) {
			console.error('Error generating contract:', error);
			toast.error('Failed to generate contract. Please try again.');
		}
	}
</script>

	<ContractPageHeader
		title={`${editContractId ? 'Edit' : ''} Event Planning Contract`}
		subtitle="Comprehensive Event Management Agreement"
	>
		{#if isLoadingContract}
			<div class="flex justify-center items-center py-12">
				<LoaderCircle class="w-8 h-8 animate-spin text-primary" />
				<span class="ml-3 text-muted-foreground">Loading contract...</span>
			</div>
		{:else}
			<EventPlanningContractForm onSubmit={handleSubmit} initialData={initialData} />
		{/if}
	</ContractPageHeader>


