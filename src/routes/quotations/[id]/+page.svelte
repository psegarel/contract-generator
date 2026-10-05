<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { ArrowLeft, Download, Pencil, RotateCcw } from '@lucide/svelte';
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { formatCurrency, formatDateString } from '$lib/utils/formatting';
	import { isQuotationExpired } from '$lib/utils/v2/quotationCalculations';
	import { downloadQuotationPdf } from '$lib/utils/v2/quotationPdfActions';
	import { createQuotationRevision, updateQuotationStatus } from '$lib/utils/v2/quotations';
	import { toast } from 'svelte-sonner';

	let { data }: { data: PageData } = $props();
	let quotation = $derived(data.quotation);
	let isDownloading = $state(false);
	let isUpdatingStatus = $state(false);
	let isCreatingRevision = $state(false);

	async function handleDownload() {
		isDownloading = true;
		try {
			await downloadQuotationPdf(quotation);
			toast.success('Quotation PDF downloaded');
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to download quotation PDF');
		} finally {
			isDownloading = false;
		}
	}

	async function handleCreateRevision() {
		isCreatingRevision = true;
		try {
			const revisionId = await createQuotationRevision(quotation.id);
			toast.success(`Revision ${quotation.revision + 1} created as a draft`);
			await goto(resolve(`/quotations/${revisionId}/edit`));
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to create revision');
		} finally {
			isCreatingRevision = false;
		}
	}

	async function handleStatus(status: 'sent' | 'accepted' | 'declined' | 'expired') {
		isUpdatingStatus = true;
		try {
			await updateQuotationStatus(quotation.id, status);
			toast.success(`Quotation marked ${status}`);
			await invalidateAll();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to update quotation');
		} finally {
			isUpdatingStatus = false;
		}
	}
</script>

<div class="mx-auto max-w-6xl px-4 py-8">
	<div class="mb-8 flex items-start justify-between gap-4">
		<div>
			<Button variant="ghost" class="mb-3 -ml-3" onclick={() => goto(resolve('/quotations'))}>
				<ArrowLeft class="size-4" /> Back to quotations
			</Button>
			<h1 class="text-3xl font-bold">{quotation.quotationNumber}</h1>
			<p class="mt-1 text-sm text-muted-foreground">Revision {quotation.revision}</p>
			<p class="mt-2 text-sm text-muted-foreground">
				{quotation.customer.companyName || quotation.customer.name} · Valid until {formatDateString(
					quotation.validUntil
				)}
			</p>
		</div>
		<div class="flex gap-2">
			<Badge variant="outline">{quotation.status}</Badge>
			{#if quotation.status === 'draft'}
				<Button variant="outline" onclick={() => goto(resolve(`/quotations/${quotation.id}/edit`))}
					><Pencil class="size-4" /> Edit</Button
				>
				<Button variant="outline" onclick={() => handleStatus('sent')} disabled={isUpdatingStatus}
					>Mark as sent</Button
				>
			{:else if quotation.status === 'sent'}
				<Button variant="outline" onclick={handleCreateRevision} disabled={isCreatingRevision}
					><RotateCcw class="size-4" />
					{isCreatingRevision ? 'Creating…' : 'Create revision'}</Button
				>
				<Button
					variant="outline"
					onclick={() => handleStatus('accepted')}
					disabled={isUpdatingStatus}>Accept</Button
				>
				<Button
					variant="outline"
					onclick={() => handleStatus('declined')}
					disabled={isUpdatingStatus}>Decline</Button
				>
			{/if}
			{#if (quotation.status === 'draft' || quotation.status === 'sent') && isQuotationExpired(quotation.validUntil)}
				<Button
					variant="outline"
					onclick={() => handleStatus('expired')}
					disabled={isUpdatingStatus}>Mark expired</Button
				>
			{/if}
			<Button onclick={handleDownload} disabled={isDownloading}
				><Download class="size-4" /> {isDownloading ? 'Preparing…' : 'Download PDF'}</Button
			>
		</div>
	</div>

	{#if data.revisionHistory.length > 1}
		<section class="mb-6 rounded-sm border border-border bg-card p-5">
			<h2 class="mb-3 text-lg font-semibold">Revision history</h2>
			<ol class="space-y-2">
				{#each data.revisionHistory as revision (revision.id)}
					<li class="flex flex-wrap items-center justify-between gap-3 text-sm">
						<a class="underline" href={resolve(`/quotations/${revision.id}`)}
							>Revision {revision.revision}</a
						>
						<span class="text-muted-foreground">{revision.status}</span>
					</li>
				{/each}
			</ol>
		</section>
	{/if}

	<div class="grid gap-6 lg:grid-cols-[1fr_320px]">
		<section class="rounded-sm border border-border bg-card p-5">
			<h2 class="mb-4 text-lg font-semibold">Equipment</h2>
			<div class="space-y-3">
				{#each quotation.lineItems as item (item.catalogItemId)}
					<div class="flex items-center gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
						<div
							class="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-muted"
						>
							{#if item.imageUrl}<img
									src={item.imageUrl}
									alt={item.name}
									class="size-full object-contain"
								/>{:else}<span class="text-xs text-muted-foreground">No image</span>{/if}
						</div>
						<div class="min-w-0 flex-1">
							<div class="font-medium">{item.name}</div>
							<div class="text-xs text-muted-foreground">
								{item.quantity} × {formatCurrency(item.unitPriceVnd)}
							</div>
						</div>
						<div class="font-medium">{formatCurrency(item.quantity * item.unitPriceVnd)}</div>
					</div>
				{/each}
			</div>
		</section>

		<aside class="h-fit rounded-sm border border-border bg-card p-5">
			<h2 class="mb-4 text-lg font-semibold">Summary</h2>
			<div class="space-y-2 text-sm">
				<div class="flex justify-between">
					<span>Equipment</span><span>{formatCurrency(quotation.equipmentSubtotalVnd)}</span>
				</div>
				<div class="flex justify-between">
					<span>Discount ({quotation.equipmentDiscountPercent}%)</span><span
						>- {formatCurrency(quotation.equipmentDiscountVnd)}</span
					>
				</div>
				<div class="flex justify-between">
					<span>Transport</span><span>{formatCurrency(quotation.transportVnd)}</span>
				</div>
				<div class="flex justify-between">
					<span>Handling</span><span>{formatCurrency(quotation.handlingVnd)}</span>
				</div>
				{#if quotation.vatRatePercent != null}
					<div class="flex justify-between">
						<span>VAT ({quotation.vatRatePercent}%)</span><span
							>{formatCurrency(quotation.vatAmountVnd ?? 0)}</span
						>
					</div>
				{/if}
				<div class="mt-4 flex justify-between border-t border-border pt-4 text-lg font-semibold">
					<span>{quotation.vatRatePercent != null ? 'Total including VAT' : 'Total'}</span><span
						>{formatCurrency(quotation.totalVnd)}</span
					>
				</div>
			</div>
		</aside>
	</div>
</div>
