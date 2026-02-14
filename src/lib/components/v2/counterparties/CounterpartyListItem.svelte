<script lang="ts">
	import type { Counterparty } from '$lib/types/v2';
	import { Mail, Phone, Eye, Edit, FileText } from 'lucide-svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import CounterpartyCard from './CounterpartyCard.svelte';

	interface Props {
		counterparty: Counterparty;
		index: number;
		getTypeLabel: (counterparty: Counterparty) => string;
	}

	let { counterparty, index, getTypeLabel }: Props = $props();
</script>

<div class={index % 2 === 0 ? 'bg-white' : 'bg-slate-100/80'}>
	<!-- Mobile & Tablet: Card Layout -->
	<div class="xl:hidden">
		<CounterpartyCard {counterparty} {getTypeLabel} backgroundColor="bg-white" />
	</div>

	<!-- Desktop: Grid Layout (16 columns) -->
	<div class="hidden xl:grid grid-cols-16 gap-3 items-center py-3 px-4">
		<!-- Name -->
		<div class="col-span-4 px-1">
			<div class="text-sm font-medium text-foreground">{counterparty.name}</div>
			{#if counterparty.address}
				<div class="text-xs text-muted-foreground">{counterparty.address}</div>
			{/if}
		</div>

		<!-- Email -->
		<div class="col-span-4 px-1">
			{#if counterparty.email}
				<a href={`mailto:${counterparty.email}`} class="text-sm hover:text-primary truncate">
					{counterparty.email}
				</a>
			{:else}
				<span class="text-xs text-muted-foreground">—</span>
			{/if}
		</div>

		<!-- Phone -->
		<div class="col-span-3 px-1">
			{#if counterparty.phone}
				<a href={`tel:${counterparty.phone}`} class="text-sm hover:text-primary">
					{counterparty.phone}
				</a>
			{:else}
				<span class="text-xs text-muted-foreground">—</span>
			{/if}
		</div>

		<!-- Type Badge -->
		<div class="col-span-2 px-1 flex justify-center">
			<Badge variant="outline">
				{getTypeLabel(counterparty)}
			</Badge>
		</div>

		<!-- Actions -->
		<div class="col-span-3 px-1 flex gap-2 justify-center">
			<Button
				variant="success"
				size="sm"
				href={`/counterparties/${counterparty.id}`}
				class="px-2"
				title="View"
			>
				<Eye class="h-4 w-4" />
			</Button>
			<Button
				variant="destructive"
				size="sm"
				href={`/counterparties/${counterparty.id}/edit`}
				class="px-2"
				title="Edit"
			>
				<Edit class="h-4 w-4" />
			</Button>
			<Button
				variant="outline"
				size="sm"
				href={`/counterparties/${counterparty.id}/contracts`}
				class="px-2"
				title="Contracts"
			>
				<FileText class="h-4 w-4" />
			</Button>
		</div>
	</div>
</div>

