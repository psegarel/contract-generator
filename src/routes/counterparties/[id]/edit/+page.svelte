<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import type { Counterparty } from '$lib/types/v2';
	import ClientForm from '$lib/components/v2/counterparties/ClientForm.svelte';
	import ServiceProviderForm from '$lib/components/v2/counterparties/ServiceProviderForm.svelte';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft, FileText } from 'lucide-svelte';
	import { Badge } from '$lib/components/ui/badge';

	let { data }: { data: PageData } = $props();

	let counterparty = $derived(data.counterparty as Counterparty);

	function getTypeLabel(type: Counterparty['type']): string {
		const labels = {
			venue: 'Venue',
			performer: 'Performer',
			'service-provider': 'Service Provider',
			client: 'Client',
			supplier: 'Supplier'
		} as const;
		return labels[type];
	}

	function getTypeBadge(type: Counterparty['type']) {
		const badges = {
			venue: { variant: 'default' as const, label: 'Venue', class: 'bg-purple-500' },
			performer: { variant: 'default' as const, label: 'Performer', class: 'bg-pink-500' },
			'service-provider': { variant: 'default' as const, label: 'Service Provider', class: 'bg-blue-500' },
			client: { variant: 'default' as const, label: 'Client', class: 'bg-emerald-500' },
			supplier: { variant: 'default' as const, label: 'Supplier', class: 'bg-amber-500' }
		} as const;
		return badges[type];
	}

	let typeBadge = $derived(getTypeBadge(counterparty.type));

	function handleSuccess() {
		goto(`/counterparties/${counterparty.id}`);
	}

	function handleCancel() {
		goto(`/counterparties/${counterparty.id}`);
	}
</script>

<div class="p-8">
	<!-- Header -->
	<div class="flex items-center justify-between mb-8">
		<div class="flex items-center gap-3">
			<Button variant="ghost" size="sm" href={`/counterparties/${counterparty.id}`}>
				<ArrowLeft class="w-4 h-4 mr-2" />
				Back
			</Button>
			<div
				class="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary"
			>
				<FileText class="w-6 h-6" />
			</div>
			<div>
				<h1 class="text-3xl font-bold tracking-tight text-foreground">Edit {counterparty.name}</h1>
				<p class="text-muted-foreground mt-1 text-sm">{getTypeLabel(counterparty.type)}</p>
			</div>
		</div>
		<Badge {...typeBadge} class={typeBadge.class}>{typeBadge.label}</Badge>
	</div>

	<!-- Edit Forms -->
	{#if counterparty.type === 'client'}
		<ClientForm client={counterparty} onSuccess={handleSuccess} onCancel={handleCancel} />
	{:else if counterparty.type === 'service-provider'}
		<ServiceProviderForm
			serviceProvider={counterparty}
			onSuccess={handleSuccess}
			onCancel={handleCancel}
		/>
	{:else}
		<!-- Read-only notice for other types -->
		<div class="border-t border-border">
			<div class="px-4 py-3">
				<div class="text-sm text-muted-foreground">
					Editing for {getTypeLabel(counterparty.type)} counterparties is coming soon.
				</div>
			</div>
		</div>
	{/if}
</div>

