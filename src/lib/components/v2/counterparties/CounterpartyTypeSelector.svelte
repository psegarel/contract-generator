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
			value: 'venue',
			label: 'Venue',
			description: 'A business with a physical event space and billing info',
			icon: '🏢'
		},
		{
			value: 'performer',
			label: 'Performer',
			description: 'Individual or group providing entertainment',
			icon: '🎭'
		},
		{
			value: 'service-provider',
			label: 'Service Provider',
			description: 'Company/individual providing services (catering, photography, etc.)',
			icon: '🔧'
		},
		{
			value: 'client',
			label: 'Client',
			description: 'Entity that hires us for events or services',
			icon: '👤'
		},
		{
			value: 'supplier',
			label: 'Supplier',
			description: 'Entity that supplies equipment or goods',
			icon: '📦'
		}
	];

	function handleSelect(type: CounterpartyType) {
		selectedType = type;
		onSelect(type);
	}
</script>

<div class="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
	{#each counterpartyTypes as counterpartyType (counterpartyType.value)}
		<button
			type="button"
			onclick={() => handleSelect(counterpartyType.value)}
			class="p-4 rounded-lg border-2 transition-all text-left {selectedType ===
			counterpartyType.value
				? 'border-blue-600 bg-blue-50'
				: 'border-gray-200 hover:border-gray-300 bg-white'}"
		>
			<div class="flex items-start gap-3">
				<div class="text-2xl">{counterpartyType.icon}</div>
				<div class="flex-1">
					<h3 class="font-semibold text-gray-900 mb-1">{counterpartyType.label}</h3>
					<p class="text-sm text-gray-600">{counterpartyType.description}</p>
				</div>
			</div>
		</button>
	{/each}
</div>
