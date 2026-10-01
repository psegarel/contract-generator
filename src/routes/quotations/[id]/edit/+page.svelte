<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';
	import QuotationForm from '$lib/components/v2/quotations/QuotationForm.svelte';

	let { data }: { data: PageData } = $props();
</script>

<div class="mx-auto max-w-6xl px-4 py-8">
	<div class="mb-6">
		<h1 class="text-3xl font-bold text-foreground">Edit {data.quotation.quotationNumber}</h1>
		<p class="mt-2 text-muted-foreground">
			Draft quotations can be updated before they are issued.
		</p>
	</div>

	{#if data.quotation.status === 'draft'}
		<QuotationForm
			quotation={data.quotation}
			clients={data.clients}
			catalogueItems={data.catalogueItems}
			onSuccess={(id) => goto(resolve(`/quotations/${id}`))}
			onCancel={() => goto(resolve(`/quotations/${data.quotation.id}`))}
		/>
	{:else}
		<div class="rounded-sm border border-border bg-card p-6">
			<p class="text-sm">Only draft quotations can be edited.</p>
			<button
				class="mt-4 text-sm text-primary underline"
				onclick={() => goto(resolve(`/quotations/${data.quotation.id}`))}
				>Return to quotation</button
			>
		</div>
	{/if}
</div>
