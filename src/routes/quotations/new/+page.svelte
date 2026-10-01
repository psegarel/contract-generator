<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { PageData } from '../$types';
	import QuotationForm from '$lib/components/v2/quotations/QuotationForm.svelte';

	let { data }: { data: PageData } = $props();

	function handleSuccess(quotationId: string) {
		goto(resolve(`/quotations/${quotationId}`));
	}
</script>

<div class="mx-auto max-w-6xl px-4 py-8">
	<div class="mb-6">
		<h1 class="text-3xl font-bold text-foreground">Create quotation</h1>
		<p class="mt-2 text-muted-foreground">
			Prepare a time-limited equipment quotation for a client or lead.
		</p>
	</div>

	<QuotationForm
		clients={data.clients}
		catalogueItems={data.catalogueItems}
		onSuccess={handleSuccess}
		onCancel={() => goto(resolve('/quotations'))}
	/>
</div>
