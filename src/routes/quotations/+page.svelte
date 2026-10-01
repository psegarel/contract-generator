<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { FileText, Plus } from '@lucide/svelte';
	import type { PageData } from './$types';
	import type { QuotationStatus } from '$lib/types/v2';
	import { Button } from '$lib/components/ui/button';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { formatCurrency, formatDateString } from '$lib/utils/formatting';

	let { data }: { data: PageData } = $props();

	const statusVariant: Record<
		QuotationStatus,
		'default' | 'secondary' | 'destructive' | 'outline'
	> = {
		draft: 'outline',
		sent: 'default',
		accepted: 'default',
		declined: 'destructive',
		expired: 'secondary'
	};

	function customerLabel(quotation: PageData['quotations'][number]): string {
		return quotation.customer.companyName || quotation.customer.name;
	}

	function createQuotation() {
		goto(resolve('/quotations/new'));
	}
</script>

<div>
	<PageHeader
		title="Quotations"
		description={`${data.quotations.length} ${data.quotations.length === 1 ? 'quotation' : 'quotations'}`}
	>
		{#snippet icon()}<FileText class="size-5" />{/snippet}
		<Button onclick={createQuotation}>
			<Plus class="size-4" />
			New Quotation
		</Button>
	</PageHeader>

	{#if data.catalogueError}
		<div class="mb-6 border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
			Equipment catalogue unavailable: {data.catalogueError}
		</div>
	{/if}

	{#if data.quotations.length === 0}
		<div class="rounded-sm border border-border bg-card py-20 text-center">
			<FileText class="mx-auto mb-4 size-12 text-muted-foreground" />
			<h2 class="text-lg font-semibold">No quotations yet</h2>
			<p class="mt-2 text-sm text-muted-foreground">Create a quotation for a client or lead.</p>
			<Button class="mt-6" onclick={createQuotation}>Create quotation</Button>
		</div>
	{:else}
		<div class="overflow-x-auto rounded-sm border border-border bg-card">
			<table class="w-full min-w-[720px] text-left text-sm">
				<thead
					class="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground"
				>
					<tr>
						<th class="px-4 py-3">Quotation</th>
						<th class="px-4 py-3">Customer</th>
						<th class="px-4 py-3">Valid until</th>
						<th class="px-4 py-3">Status</th>
						<th class="px-4 py-3 text-right">Total</th>
					</tr>
				</thead>
				<tbody>
					{#each data.quotations as quotation (quotation.id)}
						<tr
							class="cursor-pointer border-b border-border last:border-b-0 hover:bg-muted/30"
							onclick={() => goto(resolve(`/quotations/${quotation.id}`))}
							onkeydown={(event) => {
								if (event.key === 'Enter') goto(resolve(`/quotations/${quotation.id}`));
							}}
							tabindex="0"
						>
							<td class="px-4 py-4 font-medium">{quotation.quotationNumber}</td>
							<td class="px-4 py-4">
								<div>{customerLabel(quotation)}</div>
								<div class="text-xs text-muted-foreground">
									{quotation.customer.email ?? 'No email'}
								</div>
							</td>
							<td class="px-4 py-4">{formatDateString(quotation.validUntil)}</td>
							<td class="px-4 py-4">
								<Badge variant={statusVariant[quotation.status]}>{quotation.status}</Badge>
							</td>
							<td class="px-4 py-4 text-right font-medium">{formatCurrency(quotation.totalVnd)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
