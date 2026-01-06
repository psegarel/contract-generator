<script lang="ts">
	import type { Counterparty } from '$lib/types/v2';
	import { Mail, Phone, MapPin, Building2 } from 'lucide-svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';

	interface Props {
		counterparty: Counterparty;
	}

	let { counterparty }: Props = $props();

	function getTypeBadge(type: Counterparty['type']) {
		const badges = {
			'venue': { variant: 'default' as const, label: 'Venue', class: 'bg-purple-500' },
			'performer': { variant: 'default' as const, label: 'Performer', class: 'bg-pink-500' },
			'service-provider': { variant: 'default' as const, label: 'Service Provider', class: 'bg-blue-500' },
			'client': { variant: 'default' as const, label: 'Client', class: 'bg-emerald-500' },
			'supplier': { variant: 'default' as const, label: 'Supplier', class: 'bg-amber-500' }
		};
		return badges[type];
	}

	let typeBadge = $derived(getTypeBadge(counterparty.type));
</script>

<Card.Root class="hover:shadow-md transition-shadow">
	<Card.Header>
		<div class="flex items-start justify-between gap-4">
			<div class="flex-1">
				<div class="flex items-center gap-2 mb-2">
					<Building2 class="h-5 w-5 text-muted-foreground" />
					<Card.Title class="text-xl">{counterparty.name}</Card.Title>
				</div>
			</div>
			<Badge {...typeBadge}>{typeBadge.label}</Badge>
		</div>
	</Card.Header>

	<Card.Content class="space-y-3">
		<!-- Contact Information -->
		{#if counterparty.email}
			<div class="flex items-center gap-2.5 text-sm text-muted-foreground">
				<Mail class="h-4 w-4 shrink-0" />
				<a href={`mailto:${counterparty.email}`} class="hover:text-primary truncate">
					{counterparty.email}
				</a>
			</div>
		{/if}

		{#if counterparty.phone}
			<div class="flex items-center gap-2.5 text-sm text-muted-foreground">
				<Phone class="h-4 w-4 shrink-0" />
				<a href={`tel:${counterparty.phone}`} class="hover:text-primary">
					{counterparty.phone}
				</a>
			</div>
		{/if}

		{#if counterparty.address}
			<div class="flex items-start gap-2.5 text-sm text-muted-foreground">
				<MapPin class="h-4 w-4 shrink-0 mt-0.5" />
				<span class="flex-1">{counterparty.address}</span>
			</div>
		{/if}

		<!-- Notes (if present) -->
		{#if counterparty.notes}
			<div class="pt-2 border-t">
				<p class="text-xs text-muted-foreground line-clamp-2">
					{counterparty.notes}
				</p>
			</div>
		{/if}
	</Card.Content>

	<Card.Footer class="flex gap-2">
		<Button size="sm" href={`/counterparties/${counterparty.id}`} class="flex-1">
			View Details
		</Button>
		<Button
			size="sm"
			variant="outline"
			href={`/counterparties/${counterparty.id}/contracts`}
			class="flex-1"
		>
			Contracts
		</Button>
	</Card.Footer>
</Card.Root>
