<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import type { CounterpartyType } from '$lib/types/v2';

	interface Props {
		onSelect: (type: CounterpartyType) => void;
		selectedType?: CounterpartyType | null;
	}

	let { onSelect, selectedType = $bindable(null) }: Props = $props();

	const counterpartyTypes: Array<{
		value: CounterpartyType;
		label: string;
		description: string;
		icon: string;
	}> = [
		{
			value: 'client',
			label: 'Client',
			description: 'Entity that hires us for events or services',
			icon: '👤'
		},
		{
			value: 'contractor',
			label: 'Contractor',
			description: 'Performer, service provider, or other entity we pay',
			icon: '🔧'
		}
	];

	function handleSelect(type: CounterpartyType) {
		selectedType = type;
		onSelect(type);
	}
</script>

<div class="grid gap-3 grid-cols-1 md:grid-cols-2">
	{#each counterpartyTypes as counterpartyType (counterpartyType.value)}
		<Button
			type="button"
			onclick={() => handleSelect(counterpartyType.value)}
			class="h-auto w-full justify-start rounded-sm p-4 text-left {selectedType ===
			counterpartyType.value
				? 'bg-primary/10 text-foreground'
				: 'bg-card hover:bg-muted'}"
		>
			<div class="flex items-start gap-3">
				<div class="text-2xl">{counterpartyType.icon}</div>
				<div class="flex-1">
					<h3 class="mb-1 font-semibold text-foreground">{counterpartyType.label}</h3>
					<p class="text-sm text-muted-foreground">{counterpartyType.description}</p>
				</div>
			</div>
		</Button>
	{/each}
</div>
