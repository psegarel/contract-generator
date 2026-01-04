<script lang="ts">
	import type { BaseContract } from '$lib/types/v2';
	import ContractListItem from './ContractListItem.svelte';
	import { FileText } from 'lucide-svelte';

	interface Props {
		contracts: BaseContract[];
		title?: string;
		showHeaders?: boolean;
	}

	let { contracts, title = 'Contracts', showHeaders = true }: Props = $props();
</script>

<div class="border-t border-border">
	<!-- Header -->
	{#if title}
		<div class="flex items-center justify-between py-6">
			<div>
				<h2 class="text-lg font-bold tracking-tight text-foreground">{title}</h2>
				<p class="text-sm text-muted-foreground mt-1">
					{contracts.length} {contracts.length === 1 ? 'contract' : 'contracts'}
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
		<div class="max-h-96 overflow-y-auto">
			<!-- Column Headers (Desktop only) -->
			{#if showHeaders}
				<div class="hidden md:grid grid-cols-18 gap-3 items-center bg-slate-200 px-4">
					<div class="col-span-2 text-sm font-semibold px-3 py-3 border-r border-white">
						Contract #
					</div>
					<div class="col-span-3 text-sm font-semibold px-3 py-3 border-r border-white">Event</div>
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
					<div class="col-span-1 text-sm font-semibold px-3 py-3 text-center border-r border-white">
						AR/AP
					</div>
					<div class="col-span-2 text-sm font-semibold px-3 py-3 text-center border-r border-white">
						Status
					</div>
					<div class="col-span-1 text-sm font-semibold px-3 py-3 text-center">Actions</div>
				</div>
			{/if}

			<!-- Contract List -->
			{#each contracts as contract, index (contract.id)}
				<ContractListItem {contract} {index} />
			{/each}
		</div>
	{/if}
</div>
