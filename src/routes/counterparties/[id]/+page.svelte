<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import ClientForm from '$lib/components/v2/counterparties/ClientForm.svelte';

	let { data }: { data: PageData } = $props();

	function handleSuccess() {
		goto('/v2/counterparties');
	}

	function handleCancel() {
		goto('/v2/counterparties');
	}
</script>

<div class="container mx-auto px-4 py-8 max-w-4xl">
	<div class="mb-6">
		<h1 class="text-3xl font-bold text-gray-900">Edit Client</h1>
		<p class="text-gray-600 mt-2">Update client information.</p>
	</div>

	<ClientForm client={data.counterparty} onSuccess={handleSuccess} onCancel={handleCancel} />
</div>
