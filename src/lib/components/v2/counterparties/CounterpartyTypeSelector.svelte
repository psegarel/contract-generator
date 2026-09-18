<script lang="ts">
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
		<button
			type="button"
			onclick={() => handleSelect(counterpartyType.value)}
			class="p-4 rounded-lg border-2 transition-all text-left {selectedType ===
			counterpartyType.value
				? 'border-primary bg-primary/5'
				: 'border-border hover:border-border/80 bg-card'}"
		>
			<div class="flex items-start gap-3">
				<div class="text-2xl">{counterpartyType.icon}</div>
				<div class="flex-1">
					<h3 class="font-semibold text-foreground mb-1">{counterpartyType.label}</h3>
					<p class="text-sm text-muted-foreground">{counterpartyType.description}</p>
				</div>
			</div>
		</button>
	{/each}
</div>
