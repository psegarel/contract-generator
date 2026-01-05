<script lang="ts">
	import { goto } from '$app/navigation';
	import ClientForm from '$lib/components/v2/counterparties/ClientForm.svelte';

	function handleSuccess(clientId: string) {
		// Navigate to the counterparty detail page
		goto(`/v2/counterparties/${clientId}`);
	}

	function handleCancel() {
		// Navigate back to counterparties list
		goto('/v2/counterparties');
	}
</script>

<div class="container mx-auto px-4 py-8 max-w-4xl">
	<div class="mb-6">
		<h1 class="text-3xl font-bold text-gray-900">Create New Client</h1>
		<p class="text-gray-600 mt-2">Add a new client to create contracts with.</p>
	</div>

	<ClientForm onSuccess={handleSuccess} onCancel={handleCancel} />
</div>
