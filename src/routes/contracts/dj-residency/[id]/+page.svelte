<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Edit, Download, ArrowLeft } from '@lucide/svelte';
	import { formatCurrency, formatDateString } from '$lib/utils/formatting';
	import { generateDjResidencyContract } from '$lib/utils/djResidencyContractGenerator';
	import { injectRepublicHeaderIntoDocx } from '$lib/utils/contractHeader';
	import { toast } from 'svelte-sonner';
	import { logger } from '$lib/utils/logger';
	import DjResidencyPerformanceLog from '$lib/components/v2/contracts/DjResidencyPerformanceLog.svelte';
	import DjResidencyGenerateContracts from '$lib/components/v2/contracts/DjResidencyGenerateContracts.svelte';

	let { data }: { data: PageData } = $props();

	let isDownloading = $state(false);

	async function handleDownload() {
		isDownloading = true;
		try {
			const rawBlob = await generateDjResidencyContract(data.contract, data.venueCounterparty);
			const blob = await injectRepublicHeaderIntoDocx(rawBlob);
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `DJ_Residency_${data.contract.contractNumber}.docx`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
			toast.success('Contract downloaded successfully!');
		} catch (error) {
			logger.error('Download error:', error);
			toast.error('Failed to download contract');
		} finally {
			isDownloading = false;
		}
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'active':
				return 'bg-foreground text-background';
			case 'completed':
				return 'bg-primary';
			case 'terminated':
				return 'bg-destructive text-white';
			default:
				return 'bg-muted';
		}
	}
</script>

<div class="container mx-auto px-4 py-8 max-w-6xl">
	<!-- Header with actions -->
	<div class="mb-6">
		<Button variant="ghost" href="/contracts/dj-residency/list" class="mb-4">
			<ArrowLeft class="w-4 h-4 mr-2" />
			Back to list
		</Button>

		<div class="flex items-center justify-between">
			<div>
				<div class="flex items-center gap-3">
					<h1 class="text-3xl font-bold text-foreground">
						Contract #{data.contract.contractNumber}
					</h1>
					<Badge class={getStatusColor(data.contract.residencyStatus)}>
						{data.contract.residencyStatus}
					</Badge>
				</div>
				<p class="text-muted-foreground mt-1 text-sm">DJ Residency Contract</p>
			</div>
			<div class="flex gap-2">
				<Button variant="outline" href={`/contracts/dj-residency/${data.contract.id}/edit`}>
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
	</div>

	<!-- Contract Details -->
	<div class="grid gap-6 lg:grid-cols-2">
		<!-- Party B Details -->
		<div class="bg-card p-6">
			<h3 class="text-lg font-semibold text-foreground mb-4">Party B</h3>
			<div class="space-y-3">
				<div>
					<p class="text-sm text-muted-foreground">Company Name</p>
					<p class="font-medium">
						{data.venueCounterparty.companyName || data.venueCounterparty.name}
					</p>
				</div>
				<div>
					<p class="text-sm text-muted-foreground">Address</p>
					<p class="font-medium">
						{data.venueCounterparty.address || '—'}
					</p>
				</div>
				{#if data.venueCounterparty.taxId}
					<div>
						<p class="text-sm text-muted-foreground">Tax Code</p>
						<p class="font-medium">{data.venueCounterparty.taxId}</p>
					</div>
				{/if}
				{#if data.venueCounterparty.representativeName}
					<div>
						<p class="text-sm text-muted-foreground">Representative</p>
						<p class="font-medium">
							{data.venueCounterparty.representativeName}
							{#if data.venueCounterparty.representativePosition}
								({data.venueCounterparty.representativePosition})
							{/if}
						</p>
					</div>
				{/if}
			</div>
		</div>

		<!-- Contract Duration -->
		<div class="bg-card p-6">
			<h3 class="text-lg font-semibold text-foreground mb-4">Contract Duration</h3>
			<div class="space-y-3">
				<div>
					<p class="text-sm text-muted-foreground">Start Date</p>
					<p class="font-medium">{formatDateString(data.contract.contractStartDate)}</p>
				</div>
				<div>
					<p class="text-sm text-muted-foreground">End Date</p>
					<p class="font-medium">{formatDateString(data.contract.contractEndDate)}</p>
				</div>
				<div>
					<p class="text-sm text-muted-foreground">Duration</p>
					<p class="font-medium">{data.contract.contractDurationMonths} months</p>
				</div>
			</div>
		</div>

		<!-- Performance Terms -->
		<div class="bg-card p-6">
			<h3 class="text-lg font-semibold text-foreground mb-4">Performance Terms</h3>
			<div class="space-y-3">
				<div>
					<p class="text-sm text-muted-foreground">Performance Days</p>
					<p class="font-medium">{data.contract.performanceDays}</p>
				</div>
				<div>
					<p class="text-sm text-muted-foreground">Sets per Day</p>
					<p class="font-medium">{data.contract.numberOfSetsPerDay} sets</p>
				</div>
			</div>
		</div>

		<!-- Payment Terms -->
		<div class="bg-card p-6">
			<h3 class="text-lg font-semibold text-foreground mb-4">Payment Terms</h3>
			<div class="space-y-3">
				<div>
					<p class="text-sm text-muted-foreground">Hourly Rate</p>
					<p class="font-medium text-foreground text-lg">
						{formatCurrency(data.contract.performanceFeeVND)}
					</p>
					<p class="text-xs text-muted-foreground">
						Applied to actual hours in the performance log
					</p>
				</div>
				<div>
					<p class="text-sm text-muted-foreground">Termination Notice</p>
					<p class="font-medium">{data.contract.terminationNoticeDays} days</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Notes -->
	{#if data.contract.notes}
		<div class="bg-card p-6 mt-6">
			<h3 class="text-lg font-semibold text-foreground mb-4">Notes</h3>
			<p class="text-foreground/80 whitespace-pre-wrap">{data.contract.notes}</p>
		</div>
	{/if}

	<!-- Performance Log -->
	<div class="mt-6">
		<DjResidencyPerformanceLog contract={data.contract} />
	</div>

	<!-- Generate Contracts -->
	<div class="mt-6">
		<DjResidencyGenerateContracts
			contract={data.contract}
			venueCounterparty={data.venueCounterparty}
		/>
	</div>
</div>
