<script lang="ts">
	import type { BaseContract } from '$lib/types/v2';
	import { getContractDateOrCreatedAt } from '$lib/utils/v2/contractDates';
	import ContractListItem from './ContractListItem.svelte';
	import { FileText } from 'lucide-svelte';

	interface Props {
		contracts: BaseContract[];
		title?: string;
		showHeaders?: boolean;
	}

	let { contracts: unsortedContracts, title = 'Contracts', showHeaders = true }: Props = $props();

	// Sort contracts by contract date (latest first), falling back to createdAt if no date field exists
	let contracts = $derived(
		[...unsortedContracts].sort((a, b) => {
			const dateA = getContractDateOrCreatedAt(a).getTime();
			const dateB = getContractDateOrCreatedAt(b).getTime();
			return dateB - dateA; // Descending: latest first
		})
	);
</script>

<div class="border-t border-border h-full flex flex-col">
	<!-- Header -->
	{#if title}
		<div class="flex items-center justify-between py-6 flex-shrink-0">
			<div>
				<h2 class="text-lg font-bold tracking-tight text-foreground">{title}</h2>
				<p class="text-sm text-muted-foreground mt-1">
					{contracts.length}
					{contracts.length === 1 ? 'contract' : 'contracts'}
				</p>
			</div>
		</div>
	{/if}

	<!-- Content -->
	{#if contracts.length === 0}
		<div class="py-12 text-center text-muted-foreground">
			<FileText class="h-12 w-12 mx-auto mb-3 opacity-50" />
			<p class="text-sm font-medium mb-1">No contracts yet</p>
			<p class="text-xs">Create your first contract to see it here</p>
		</div>
	{:else}
		<!-- Desktop Grid View: Scrolling container -->
		<div class="hidden xl:block flex-1 min-h-0 overflow-y-auto">
			<!-- Column Headers (Desktop only) -->
			{#if showHeaders}
				<div class="grid grid-cols-18 gap-3 items-center bg-slate-200 px-4">
					<div class="col-span-2 text-sm font-semibold px-3 py-3 border-r border-white">
						Contract #
					</div>
					<div class="col-span-2 text-sm font-semibold px-3 py-3 border-r border-white">Event</div>
					<div class="col-span-3 text-sm font-semibold px-3 py-3 border-r border-white">
						Counterparty
					</div>
					<div class="col-span-2 text-sm font-semibold px-3 py-3 text-right border-r border-white">
						Value
					</div>
					<div class="col-span-2 text-sm font-semibold px-3 py-3 text-center border-r border-white">
						Date
					</div>
					<div class="col-span-2 text-sm font-semibold px-3 py-3 text-center border-r border-white">
						Type
					</div>
					<div class="col-span-2 text-sm font-semibold px-3 py-3 text-center border-r border-white">
						Payment
					</div>
					<div class="col-span-2 text-sm font-semibold px-3 py-3 text-center border-r border-white">Actions</div>
					<div class="col-span-1 text-sm font-semibold px-3 py-3 text-center">Delete</div>
				</div>
			{/if}

			<!-- Desktop Grid List -->
			<div>
				{#each contracts as contract, index (contract.id)}
					<ContractListItem {contract} {index} />
				{/each}
			</div>
		</div>

		<!-- Tablet & Mobile: Full page scroll (no scrolling container) -->
		<div class="xl:hidden">
			<!-- Tablet: 2-column card grid -->
			<div class="hidden md:grid grid-cols-2 gap-4 pb-4">
				{#each contracts as contract, index (contract.id)}
					<ContractListItem {contract} {index} />
				{/each}
			</div>
			<!-- Mobile: Single column -->
			<div class="md:hidden">
				{#each contracts as contract, index (contract.id)}
					<ContractListItem {contract} {index} />
				{/each}
			</div>
		</div>
	{/if}
</div>
