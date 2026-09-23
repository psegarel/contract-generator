<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Edit, Download } from '@lucide/svelte';
	import { downloadContract } from '$lib/utils/v2';

	let { data }: { data: PageData } = $props();

	let isDownloading = $state(false);

	async function handleDownload() {
		isDownloading = true;
		try {
			await downloadContract(data.contract);
		} catch (error) {
			// Error already handled in downloadContract with toast
		} finally {
			isDownloading = false;
		}
	}
</script>

<div class="container mx-auto px-4 py-8">
	<div class="mb-6 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-foreground">Contract #{data.contract.contractNumber}</h1>
			<p class="text-muted-foreground mt-1 text-sm">
				Equipment Rental (One-Off) — Quotation: {data.contract.quotationReference}
			</p>
		</div>
		<div class="flex gap-2">
			<Button
				variant="outline"
				href={`/contracts/equipment-rental-oneoff/${data.contract.id}/edit`}
			>
				<Edit class="w-4 h-4 mr-2" />
				Edit
			</Button>
			<Button variant="outline" onclick={handleDownload} disabled={isDownloading}>
				{#if isDownloading}
					<span class="animate-spin mr-2">⏳</span>
				{:else}
					<Download class="w-4 h-4 mr-2" />
				{/if}
				Download
			</Button>
		</div>
	</div>

	{#if data.html}
		<div class="bg-white p-8 print:p-0">
			<div class="contract-html-preview">
				{@html data.html}
			</div>
		</div>
	{:else}
		<div class="bg-muted p-6 text-foreground">
			<p class="font-semibold">Preview unavailable</p>
			<p class="text-sm mt-1">
				The contract template has not been added yet. The contract data is saved — preview and
				download will work once the template is in place.
			</p>
		</div>
	{/if}
</div>
