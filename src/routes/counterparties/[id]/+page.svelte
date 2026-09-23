<script lang="ts">
	import type { PageData } from './$types';
	import type {
		Counterparty,
		ClientCounterparty,
		ServiceProviderContractor,
		PerformerContractor
	} from '$lib/types/v2';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft, FileText, Edit } from '@lucide/svelte';
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
		if (cp.type === 'client') return 'bg-emerald-500';
		if (cp.type === 'contractor' && 'contractorType' in cp) {
			if (cp.contractorType === 'performer') return 'bg-pink-500';
			if (cp.contractorType === 'service-provider') return 'bg-primary';
		}
		return 'bg-muted';
	}

	let displayType = $derived(getDisplayType(counterparty));
	let badgeClass = $derived(getTypeBadgeClass(counterparty));
</script>

{#key counterparty.id}
	<div>
		<PageHeader title={counterparty.name} description={displayType}>
			{#snippet leading()}
				<Button variant="ghost" size="sm" href="/counterparties">
					<ArrowLeft class="size-4" />
					Back
				</Button>
			{/snippet}
			{#snippet icon()}
				<FileText class="size-5" />
			{/snippet}
			{#snippet children()}
				<Badge variant="default" class={badgeClass}>{displayType}</Badge>
				<Button href={`/counterparties/${counterparty.id}/edit`}>
					<Edit class="size-4" />
					Edit
				</Button>
			{/snippet}
		</PageHeader>

		<!-- View-only content -->
		<div>
			<!-- Basic Information -->
			<div class="mb-1">
				<div class="px-4 py-3 bg-muted">
					<div class="text-sm font-semibold text-foreground">Basic Information</div>
				</div>
				<div class="px-4 py-3 space-y-3">
					<div>
						<div class="text-xs text-muted-foreground mb-1">Name</div>
						<div class="text-sm text-foreground">{counterparty.name}</div>
					</div>

					{#if counterparty.email}
						<div>
							<div class="text-xs text-muted-foreground mb-1">Email</div>
							<a href={`mailto:${counterparty.email}`} class="text-sm text-primary hover:underline">
								{counterparty.email}
							</a>
						</div>
					{/if}

					{#if counterparty.phone}
						<div>
							<div class="text-xs text-muted-foreground mb-1">Phone</div>
							<a href={`tel:${counterparty.phone}`} class="text-sm text-primary hover:underline">
								{counterparty.phone}
							</a>
						</div>
					{/if}

					{#if counterparty.address}
						<div>
							<div class="text-xs text-muted-foreground mb-1">Address</div>
							<div class="text-sm text-foreground">{counterparty.address}</div>
						</div>
					{/if}
				</div>
			</div>

			<!-- Client-specific fields -->
			{#if counterparty.type === 'client'}
				{@const client = counterparty as ClientCounterparty}
				<div class="mb-1">
					<div class="px-4 py-3 bg-muted">
						<div class="text-sm font-semibold text-foreground">Client Details</div>
					</div>
					<div class="px-4 py-3 space-y-3">
						<div>
							<div class="text-xs text-muted-foreground mb-1">Client Type</div>
							<div class="text-sm text-foreground">
								{client.clientType === 'individual' ? 'Individual' : 'Company'}
							</div>
						</div>

						{#if client.clientType === 'company'}
							{#if client.companyName}
								<div>
									<div class="text-xs text-muted-foreground mb-1">Company Name</div>
									<div class="text-sm text-foreground">{client.companyName}</div>
								</div>
							{/if}
							{#if client.representativeName}
								<div>
									<div class="text-xs text-muted-foreground mb-1">Representative Name</div>
									<div class="text-sm text-foreground">{client.representativeName}</div>
								</div>
							{/if}
							{#if client.representativePosition}
								<div>
									<div class="text-xs text-muted-foreground mb-1">Representative Position</div>
									<div class="text-sm text-foreground">{client.representativePosition}</div>
								</div>
							{/if}
						{:else if client.idDocument}
							<div>
								<div class="text-xs text-muted-foreground mb-1">ID Document</div>
								<div class="text-sm text-foreground">{client.idDocument}</div>
							</div>
						{/if}

						{#if client.taxId}
							<div>
								<div class="text-xs text-muted-foreground mb-1">Tax ID</div>
								<div class="text-sm text-foreground">{client.taxId}</div>
							</div>
						{/if}

						{#if client.bankName || client.bankAccountNumber}
							<div>
								<div class="text-xs text-muted-foreground mb-1">Banking</div>
								<div class="text-sm text-foreground">
									{#if client.bankName && client.bankAccountNumber}
										{client.bankName} - {client.bankAccountNumber}
									{:else if client.bankName}
										{client.bankName}
									{:else if client.bankAccountNumber}
										{client.bankAccountNumber}
									{/if}
								</div>
							</div>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Service Provider-specific fields -->
			{#if counterparty.type === 'contractor' && 'contractorType' in counterparty && counterparty.contractorType === 'service-provider'}
				{@const provider = counterparty as ServiceProviderContractor}
				<div class="mb-1">
					<div class="px-4 py-3 bg-muted">
						<div class="text-sm font-semibold text-foreground">Service Provider Details</div>
					</div>
					<div class="px-4 py-3 space-y-3">
						<div>
							<div class="text-xs text-muted-foreground mb-1">Service Type</div>
							<div class="text-sm text-foreground">{provider.serviceType}</div>
						</div>

						{#if provider.companyName}
							<div>
								<div class="text-xs text-muted-foreground mb-1">Company Name</div>
								<div class="text-sm text-foreground">{provider.companyName}</div>
							</div>
						{/if}

						{#if provider.typicalDeliverables && provider.typicalDeliverables.length > 0}
							<div>
								<div class="text-xs text-muted-foreground mb-1">Typical Deliverables</div>
								<div class="flex flex-wrap gap-2">
									{#each provider.typicalDeliverables as deliverable}
										<span
											class="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs"
										>
											{deliverable}
										</span>
									{/each}
								</div>
							</div>
						{/if}

						{#if provider.equipmentProvided && provider.equipmentProvided.length > 0}
							<div>
								<div class="text-xs text-muted-foreground mb-1">Equipment Provided</div>
								<div class="flex flex-wrap gap-2">
									{#each provider.equipmentProvided as equipment}
										<span
											class="inline-flex items-center px-2 py-1 bg-green-50 text-green-700 rounded-md text-xs"
										>
											{equipment}
										</span>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Performer-specific fields -->
			{#if counterparty.type === 'contractor' && 'contractorType' in counterparty && counterparty.contractorType === 'performer'}
				{@const performer = counterparty as PerformerContractor}
				<div class="mb-1">
					<div class="px-4 py-3 bg-muted">
						<div class="text-sm font-semibold text-foreground">Performer Details</div>
					</div>
					<div class="px-4 py-3 space-y-3">
						<div>
							<div class="text-xs text-muted-foreground mb-1">Stage Name</div>
							<div class="text-sm text-foreground">{performer.stageName}</div>
						</div>

						<div>
							<div class="text-xs text-muted-foreground mb-1">Performer Type</div>
							<div class="text-sm text-foreground">{performer.performerType}</div>
						</div>

						{#if performer.genre}
							<div>
								<div class="text-xs text-muted-foreground mb-1">Genre</div>
								<div class="text-sm text-foreground">{performer.genre}</div>
							</div>
						{/if}

						{#if performer.technicalRider}
							<div>
								<div class="text-xs text-muted-foreground mb-1">Technical Rider</div>
								<div class="text-sm text-foreground whitespace-pre-wrap">
									{performer.technicalRider}
								</div>
							</div>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Notes -->
			{#if counterparty.notes}
				<div class="mb-1">
					<div class="px-4 py-3 bg-muted">
						<div class="text-sm font-semibold text-foreground">Notes</div>
					</div>
					<div class="px-4 py-3">
						<div class="text-sm text-foreground whitespace-pre-wrap">{counterparty.notes}</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/key}
