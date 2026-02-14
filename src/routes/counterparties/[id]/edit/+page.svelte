<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import type { Counterparty, PerformerContractor, ServiceProviderContractor } from '$lib/types/v2';
	import ClientForm from '$lib/components/v2/counterparties/ClientForm.svelte';
	import ServiceProviderForm from '$lib/components/v2/counterparties/ServiceProviderForm.svelte';
	import PerformerForm from '$lib/components/v2/counterparties/PerformerForm.svelte';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft, FileText } from 'lucide-svelte';
	import { Badge } from '$lib/components/ui/badge';

	let { data }: { data: PageData } = $props();

	let counterparty = $derived(data.counterparty as Counterparty);

	function getDisplayType(cp: Counterparty): string {
		if (cp.type === 'client') return 'Client';
		if (cp.type === 'contractor' && 'contractorType' in cp) {
			if (cp.contractorType === 'performer') return 'Performer';
			if (cp.contractorType === 'service-provider') return 'Service Provider';
		}
		return 'Unknown';
	}

	function getTypeBadgeClass(cp: Counterparty): string {
		if (cp.type === 'client') return 'bg-emerald-500';
		if (cp.type === 'contractor' && 'contractorType' in cp) {
			if (cp.contractorType === 'performer') return 'bg-pink-500';
			if (cp.contractorType === 'service-provider') return 'bg-blue-500';
		}
		return 'bg-gray-500';
	}

	let displayType = $derived(getDisplayType(counterparty));
	let badgeClass = $derived(getTypeBadgeClass(counterparty));

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
				<p class="text-muted-foreground mt-1 text-sm">{displayType}</p>
			</div>
		</div>
		<Badge variant="default" class={badgeClass}>{displayType}</Badge>
	</div>

	<!-- Edit Forms -->
	{#if counterparty.type === 'client'}
		<ClientForm client={counterparty} onSuccess={handleSuccess} onCancel={handleCancel} />
	{:else if counterparty.type === 'contractor' && 'contractorType' in counterparty && counterparty.contractorType === 'service-provider'}
		<ServiceProviderForm
			serviceProvider={counterparty as ServiceProviderContractor}
			onSuccess={handleSuccess}
			onCancel={handleCancel}
		/>
	{:else if counterparty.type === 'contractor' && 'contractorType' in counterparty && counterparty.contractorType === 'performer'}
		<PerformerForm
			performer={counterparty as PerformerContractor}
			onSuccess={handleSuccess}
			onCancel={handleCancel}
		/>
	{/if}
</div>
