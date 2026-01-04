<script lang="ts">
	import { goto } from '$app/navigation';
	import ServiceProvisionForm from '$lib/components/v2/contracts/ServiceProvisionForm.svelte';

	function handleSuccess(contractId: string) {
		goto(`/v2/contracts/service-provision/${contractId}`);
	}

	function handleCancel() {
		goto('/v2/contracts');
	}
</script>

<div class="container mx-auto px-4 py-8 max-w-6xl">
	<div class="mb-6">
		<h1 class="text-3xl font-bold text-gray-900">Create Service Provision Contract</h1>
		<p class="text-gray-600 mt-2">Create a contract for providing AV/technical services to a client.</p>
	</div>

	<ServiceProvisionForm onSuccess={handleSuccess} onCancel={handleCancel} />
</div>
