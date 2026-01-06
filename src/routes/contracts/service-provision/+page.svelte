<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import ServiceProvisionForm from '$lib/components/v2/contracts/ServiceProvisionForm.svelte';
	import ServiceContractForm from '$lib/components/v1/ServiceContractForm.svelte';
	import ContractPageHeader from '$lib/components/ContractPageHeader.svelte';
	import { page } from '$app/state';

	let { data }: { data: PageData } = $props();

	// Check if editing a v1 contract (has edit query parameter)
	let isEditingV1 = $derived(page.url.searchParams.has('edit'));

	function handleSuccess(contractId: string) {
		goto(`/contract/service/${contractId}`);
	}

	function handleCancel() {
		goto('/contracts/service-provision/list');
	}
</script>

{#if isEditingV1}
	<!-- Use v1 form for editing old service contracts -->
	<ContractPageHeader
		title="Service Contract"
		subtitle="Bilingual Generation Engine"
	>
		<ServiceContractForm />
	</ContractPageHeader>
{:else}
	<!-- Use v2 form for creating new contracts -->
	<div class="container mx-auto px-4 py-8 max-w-6xl">
		<div class="mb-6">
			<h1 class="text-3xl font-bold text-gray-900">Create Service Provision Contract</h1>
			<p class="text-gray-600 mt-2">
				Create a contract for providing AV/technical services to a client.
			</p>
		</div>

		<ServiceProvisionForm initialEventId={data.eventId || ''} onSuccess={handleSuccess} onCancel={handleCancel} />
	</div>
{/if}
