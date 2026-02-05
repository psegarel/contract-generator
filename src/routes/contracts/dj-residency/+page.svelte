<script lang="ts">
	import { goto } from '$app/navigation';
	import DjResidencyForm from '$lib/components/v2/contracts/DjResidencyForm.svelte';

	function handleSuccess(contractId: string) {
		goto(`/contracts/dj-residency/${contractId}`);
	}

	function handleCancel() {
		goto('/contracts');
	}
</script>

<div class="container mx-auto px-4 py-8 max-w-6xl">
	<div class="mb-6">
		<h1 class="text-3xl font-bold text-gray-900">Create DJ Residency Contract</h1>
		<p class="text-gray-600 mt-2">
			Create a framework agreement for regular DJ performances at a venue.
		</p>
	</div>

	<DjResidencyForm onSuccess={handleSuccess} onCancel={handleCancel} />
</div>
