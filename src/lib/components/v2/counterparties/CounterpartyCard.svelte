<script lang="ts">
	import type { Counterparty } from '$lib/types/v2';
	import { Mail, Phone, Eye, Edit, FileText } from 'lucide-svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';

	interface Props {
		counterparty: Counterparty;
		getTypeLabel: (counterparty: Counterparty) => string;
		backgroundColor?: string;
	}

	let {
		counterparty,
		getTypeLabel,
		backgroundColor = 'bg-white'
	}: Props = $props();
</script>

<div class="space-y-4 py-4 px-4 border border-border rounded-lg {backgroundColor}">
	<!-- Header -->
	<div class="flex items-start justify-between gap-2">
		<div class="flex-1 min-w-0">
			<h3 class="text-base font-bold tracking-tight truncate">
				{counterparty.name}
			</h3>
			{#if counterparty.address}
				<p class="text-sm text-muted-foreground truncate mt-0.5">
					{counterparty.address}
				</p>
			{/if}
		</div>
		<Badge variant="outline" class="shrink-0">
			{getTypeLabel(counterparty)}
		</Badge>
	</div>

	<!-- Details -->
	<div class="space-y-1.5 text-sm">
		{#if counterparty.email}
			<div class="flex items-center gap-2 text-muted-foreground">
				<Mail class="h-3.5 w-3.5 shrink-0" />
				<a href={`mailto:${counterparty.email}`} class="hover:text-primary truncate">
					{counterparty.email}
				</a>
			</div>
		{/if}
		{#if counterparty.phone}
			<div class="flex items-center gap-2 text-muted-foreground">
				<Phone class="h-3.5 w-3.5 shrink-0" />
				<a href={`tel:${counterparty.phone}`} class="hover:text-primary">
					{counterparty.phone}
				</a>
			</div>
		{/if}
	</div>

	<!-- Actions - All buttons on same line -->
	<div class="pt-4 flex gap-2 flex-wrap">
		<Button
			variant="success"
			size="sm"
			href={`/counterparties/${counterparty.id}`}
			class="shrink-0"
		>
			<Eye class="h-3.5 w-3.5 mr-1.5" />
			View
		</Button>
		<Button
			variant="destructive"
			size="sm"
			href={`/counterparties/${counterparty.id}/edit`}
			class="shrink-0"
		>
			<Edit class="h-3.5 w-3.5 mr-1.5" />
			Edit
		</Button>
		<Button
			variant="outline"
			size="sm"
			href={`/counterparties/${counterparty.id}/contracts`}
			class="shrink-0"
		>
			<FileText class="h-3.5 w-3.5 mr-1.5" />
			Contracts
		</Button>
	</div>
</div>
