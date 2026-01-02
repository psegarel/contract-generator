<script lang="ts">
	import type { PageData } from './$types';
	import type { SavedEventPlanningContract } from '$lib/utils/eventPlanningContracts';
	import AuthGuard from '$lib/components/AuthGuard.svelte';
	import { FileText } from 'lucide-svelte';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';

	let { data }: { data: PageData } = $props();

	function handleContractsUpdate(updatedContracts: SavedEventPlanningContract[]) {
		data.contracts = updatedContracts;
	}
</script>

<AuthGuard>
	<div class="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
		<div class="max-w-6xl mx-auto">
			<div class="mb-8">
				<h1 class="text-3xl font-medium text-foreground mb-3">Event Planning Contracts</h1>
				<p class="text-muted-foreground">View and manage your event planning contracts</p>
			</div>

			{#if data.contracts.length === 0}
				<Card class="p-12 text-center">
					<FileText class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
					<h3 class="text-lg font-medium text-foreground mb-2">No event planning contracts found</h3>
					<p class="text-muted-foreground mb-6">
						You haven't created any event planning contracts yet. Create your first contract to see it here.
					</p>
					<Button href="/contracts/event-planning">Create Event Planning Contract</Button>
				</Card>
			{:else}
				<div class="space-y-4">
					{#each data.contracts as contract (contract.id)}
						<Card class="p-6">
							<div class="flex justify-between items-start">
								<div>
									<h3 class="text-lg font-semibold mb-2">{contract.contractData.eventName}</h3>
									<p class="text-sm text-muted-foreground">Client: {contract.contractData.clientCompany}</p>
									<p class="text-sm text-muted-foreground">Event Date: {contract.contractData.eventDate}</p>
									<p class="text-sm text-muted-foreground">Venue: {contract.contractData.eventVenue}</p>
								</div>
								<div class="text-sm text-muted-foreground">
									Contract #: {contract.contractNumber}
								</div>
							</div>
						</Card>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</AuthGuard>
