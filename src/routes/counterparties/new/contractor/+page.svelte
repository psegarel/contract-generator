<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import ServiceProviderForm from '$lib/components/v2/counterparties/ServiceProviderForm.svelte';
	import PerformerForm from '$lib/components/v2/counterparties/PerformerForm.svelte';
	import type { ContractorType } from '$lib/types/v2';

	let contractorType = $state<ContractorType | null>(null);

	// Check URL params for pre-selected type
	$effect(() => {
		const urlType = $page.url.searchParams.get('type');
		if (urlType === 'performer' || urlType === 'service-provider') {
			contractorType = urlType;
		}
	});

	function handleSuccess(id: string) {
		goto(`/counterparties/${id}`);
	}

	function handleCancel() {
		goto('/counterparties');
	}

	function selectType(type: ContractorType) {
		contractorType = type;
	}
</script>

<div class="container mx-auto px-4 py-8 max-w-4xl">
	<div class="mb-6">
		<h1 class="text-3xl font-bold text-gray-900">Create New Contractor</h1>
		<p class="text-gray-600 mt-2">Add a performer or service provider you work with.</p>
	</div>

	{#if !contractorType}
		<!-- Contractor type selector -->
		<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
			<button
				type="button"
				onclick={() => selectType('performer')}
				class="p-6 rounded-lg border-2 border-gray-200 hover:border-pink-400 bg-white text-left transition-all"
			>
				<div class="flex items-start gap-3">
					<div class="text-3xl">🎭</div>
					<div>
						<h3 class="font-semibold text-gray-900 mb-1">Performer</h3>
						<p class="text-sm text-gray-600">
							DJ, band, MC, dancer, or other entertainment provider
						</p>
					</div>
				</div>
			</button>

			<button
				type="button"
				onclick={() => selectType('service-provider')}
				class="p-6 rounded-lg border-2 border-gray-200 hover:border-blue-400 bg-white text-left transition-all"
			>
				<div class="flex items-start gap-3">
					<div class="text-3xl">🔧</div>
					<div>
						<h3 class="font-semibold text-gray-900 mb-1">Service Provider</h3>
						<p class="text-sm text-gray-600">
							Catering, photography, security, AV, or other services
						</p>
					</div>
				</div>
			</button>
		</div>

		<div class="mt-4">
			<button
				type="button"
				onclick={handleCancel}
				class="text-sm text-gray-500 hover:text-gray-700"
			>
				Cancel
			</button>
		</div>
	{:else if contractorType === 'performer'}
		<div class="mb-4">
			<button
				type="button"
				onclick={() => (contractorType = null)}
				class="text-sm text-blue-600 hover:text-blue-800"
			>
				&larr; Change contractor type
			</button>
		</div>
		<PerformerForm onSuccess={handleSuccess} onCancel={handleCancel} />
	{:else}
		<div class="mb-4">
			<button
				type="button"
				onclick={() => (contractorType = null)}
				class="text-sm text-blue-600 hover:text-blue-800"
			>
				&larr; Change contractor type
			</button>
		</div>
		<ServiceProviderForm onSuccess={handleSuccess} onCancel={handleCancel} />
	{/if}
</div>
