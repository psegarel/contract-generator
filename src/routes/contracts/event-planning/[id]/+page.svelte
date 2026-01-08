<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft, Edit, Download } from 'lucide-svelte';
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
	<!-- Header with actions -->
	<div class="mb-6 flex items-center justify-between">
		<div class="flex items-center gap-3">
			<Button variant="ghost" size="sm" href="/contracts/event-planning/list">
				<ArrowLeft class="w-4 h-4 mr-2" />
				Back
			</Button>
			<div>
				<h1 class="text-3xl font-bold text-gray-900">Contract #{data.contract.contractNumber}</h1>
				<p class="text-gray-600 mt-1 text-sm">Event Planning Contract</p>
			</div>
		</div>
		<div class="flex gap-2">
			<Button variant="outline" href={`/contracts/event-planning/${data.contract.id}/edit`}>
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

	<!-- Contract Preview - HTML from Word template -->
	<div class="bg-white rounded-lg p-8 print:p-0">
		<div class="contract-html-preview">
			{@html data.html}
		</div>
	</div>
</div>
