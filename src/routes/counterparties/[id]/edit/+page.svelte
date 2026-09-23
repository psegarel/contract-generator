<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';
	import type { Counterparty, PerformerContractor, ServiceProviderContractor } from '$lib/types/v2';
	import ClientForm from '$lib/components/v2/counterparties/ClientForm.svelte';
	import ServiceProviderForm from '$lib/components/v2/counterparties/ServiceProviderForm.svelte';
	import PerformerForm from '$lib/components/v2/counterparties/PerformerForm.svelte';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft, FileText } from '@lucide/svelte';
	import { Badge } from '$lib/components/ui/badge';
	import PageHeader from '$lib/components/PageHeader.svelte';

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
		if (cp.type === 'client') return 'bg-foreground text-background';
		if (cp.type === 'contractor' && 'contractorType' in cp) {
			if (cp.contractorType === 'performer') return 'bg-muted text-foreground';
			if (cp.contractorType === 'service-provider') return 'bg-primary';
		}
		return 'bg-muted';
	}

	let displayType = $derived(getDisplayType(counterparty));
	let badgeClass = $derived(getTypeBadgeClass(counterparty));

	function handleSuccess() {
		goto(resolve(`/counterparties/${counterparty.id}`));
	}

	function handleCancel() {
		goto(resolve(`/counterparties/${counterparty.id}`));
	}
</script>

<div>
	<PageHeader title={`Edit ${counterparty.name}`} description={displayType}>
		{#snippet leading()}
			<Button variant="ghost" size="sm" href={`/counterparties/${counterparty.id}`}>
				<ArrowLeft class="size-4" />
				Back
			</Button>
		{/snippet}
		{#snippet icon()}
			<FileText class="size-5" />
		{/snippet}
		<Badge variant="default" class={badgeClass}>{displayType}</Badge>
	</PageHeader>

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
