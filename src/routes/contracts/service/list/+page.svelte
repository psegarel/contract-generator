<script lang="ts">
	import type { PageData } from './$types';
	import type { SavedServiceContract } from '$lib/utils/serviceContracts';
	import AuthGuard from '$lib/components/AuthGuard.svelte';
	import ServiceContractList from '$lib/components/ServiceContractList.svelte';
	import { FileText } from 'lucide-svelte';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';

	let { data }: { data: PageData } = $props();

	function handleContractsUpdate(updatedContracts: SavedServiceContract[]) {
		data.contracts = updatedContracts;
	}
</script>

<AuthGuard>
	<div class="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
		<div class="max-w-6xl mx-auto">
			<div class="mb-8">
				<h1 class="text-3xl font-medium text-foreground mb-3">Service Contracts</h1>
				<p class="text-muted-foreground">View and manage your service contracts</p>
			</div>

			{#if data.contracts.length === 0}
				<Card class="p-12 text-center">
					<FileText class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
					<h3 class="text-lg font-medium text-foreground mb-2">No service contracts found</h3>
					<p class="text-muted-foreground mb-6">
						You haven't created any service contracts yet. Create your first contract to see it here.
					</p>
					<Button href="/contracts/service-contract">Create Service Contract</Button>
				</Card>
			{:else}
				<ServiceContractList
					contracts={data.contracts}
					onContractsUpdate={handleContractsUpdate}
				/>
			{/if}
		</div>
	</div>
</AuthGuard>
