<script lang="ts">
	import AuthGuard from '$lib/components/AuthGuard.svelte';
	import EventPlanningContractForm from '$lib/components/EventPlanningContractForm.svelte';
	import { generateEventPlanningContract } from '$lib/utils/eventPlanningContractGenerator';
	import { saveEventPlanningContract } from '$lib/utils/contracts';
	import { authStore } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import type { EventPlanningContractData } from '$lib/schemas/eventPlanningContract';

	async function handleSubmit(formData: EventPlanningContractData) {
		try {
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
			if (authStore.user?.uid && formData.contractLocation) {
				try {
					await saveEventPlanningContract(
						authStore.user.uid,
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
					goto('/contracts/history');
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
			goto('/contracts/history');
		} catch (error) {
			console.error('Error generating contract:', error);
			toast.error('Failed to generate contract. Please try again.');
		}
	}
</script>

<AuthGuard>
	<div class="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
		<div class="max-w-4xl mx-auto">
			<div class="mb-8">
				<h1 class="text-3xl font-medium text-foreground mb-3">Event Planning Contract</h1>
				<p class="text-muted-foreground">
					Generate professional bilingual event planning service contracts
				</p>
			</div>

			<EventPlanningContractForm onSubmit={handleSubmit} />
		</div>
	</div>
</AuthGuard>
