<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import ServiceProviderForm from '$lib/components/v2/counterparties/ServiceProviderForm.svelte';
	import PerformerForm from '$lib/components/v2/counterparties/PerformerForm.svelte';
	import { Button } from '$lib/components/ui/button';
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
		<h1 class="text-3xl font-bold text-foreground">Create New Contractor</h1>
		<p class="text-muted-foreground mt-2">Add a performer or service provider you work with.</p>
	</div>

	{#if !contractorType}
		<!-- Contractor type selector -->
		<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
			<Button
				type="button"
				onclick={() => selectType('performer')}
				class="h-auto w-full justify-start rounded-lg border-2 p-6 text-left transition-all {contractorType ===
				'performer'
					? 'border-primary bg-primary/5 text-foreground'
					: 'border-border bg-card hover:border-primary/60'}"
			>
				<div class="flex items-start gap-3">
					<div class="text-3xl">🎭</div>
					<div>
						<h3 class="mb-1 font-semibold text-foreground">Performer</h3>
						<p class="text-sm text-muted-foreground">
							DJ, band, MC, dancer, or other entertainment provider
						</p>
					</div>
				</div>
			</Button>

			<Button
				type="button"
				onclick={() => selectType('service-provider')}
				class="h-auto w-full justify-start rounded-lg border-2 p-6 text-left transition-all {contractorType ===
				'service-provider'
					? 'border-primary bg-primary/5 text-foreground'
					: 'border-border bg-card hover:border-primary/60'}"
			>
				<div class="flex items-start gap-3">
					<div class="text-3xl">🔧</div>
					<div>
						<h3 class="mb-1 font-semibold text-foreground">Service Provider</h3>
						<p class="text-sm text-muted-foreground">
							Catering, photography, security, AV, or other services
						</p>
					</div>
				</div>
			</Button>
		</div>

		<div class="mt-4">
			<Button variant="ghost" onclick={handleCancel}>Cancel</Button>
		</div>
	{:else if contractorType === 'performer'}
		<div class="mb-4">
			<Button variant="link" class="h-auto p-0" onclick={() => (contractorType = null)}>
				&larr; Change contractor type
			</Button>
		</div>
		<PerformerForm onSuccess={handleSuccess} onCancel={handleCancel} />
	{:else}
		<div class="mb-4">
			<Button variant="link" class="h-auto p-0" onclick={() => (contractorType = null)}>
				&larr; Change contractor type
			</Button>
		</div>
		<ServiceProviderForm onSuccess={handleSuccess} onCancel={handleCancel} />
	{/if}
</div>
