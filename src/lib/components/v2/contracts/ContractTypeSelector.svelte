<script lang="ts">
	import type { ContractType } from '$lib/types/v2';

	interface Props {
		onSelect: (type: ContractType) => void;
		selectedType?: ContractType | null;
	}

	let { onSelect, selectedType = $bindable(null) }: Props = $props();

	const contractTypes: Array<{
		value: ContractType;
		label: string;
		description: string;
		direction: 'receivable' | 'payable' | 'both';
	}> = [
		{
			value: 'venue-rental',
			label: 'Venue Rental',
			description: 'We rent a venue from a venue owner',
			direction: 'payable'
		},
		{
			value: 'performer-booking',
			label: 'Performer Booking',
			description: 'We book a performer (hire them or provide them to client)',
			direction: 'both'
		},
		{
			value: 'equipment-rental',
			label: 'Equipment Rental',
			description: 'We rent equipment to/from someone',
			direction: 'both'
		},
		{
			value: 'service-provision',
			label: 'Service Provision',
			description: 'We provide AV/technical services to a client',
			direction: 'receivable'
		},
		{
			value: 'event-planning',
			label: 'Event Planning',
			description: 'We organize a full event for a client',
			direction: 'receivable'
		},
		{
			value: 'subcontractor',
			label: 'Subcontractor',
			description: 'We hire an external service provider',
			direction: 'payable'
		},
		{
			value: 'client-service',
			label: 'Client Service',
			description: 'Generic client service contract',
			direction: 'receivable'
		}
	];

	function handleSelect(type: ContractType) {
		selectedType = type;
		onSelect(type);
	}
</script>

<div class="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
	{#each contractTypes as contractType (contractType.value)}
		<button
			type="button"
			onclick={() => handleSelect(contractType.value)}
			class="p-4 rounded-lg border-2 transition-all text-left {selectedType ===
			contractType.value
				? 'border-blue-600 bg-blue-50'
				: 'border-gray-200 hover:border-gray-300 bg-white'}"
		>
			<div class="flex items-start justify-between gap-2 mb-2">
				<h3 class="font-semibold text-gray-900">{contractType.label}</h3>
				<span
					class="text-xs px-2 py-1 rounded-full {contractType.direction === 'receivable'
						? 'bg-emerald-100 text-emerald-800'
						: contractType.direction === 'payable'
							? 'bg-red-100 text-red-800'
							: 'bg-blue-100 text-blue-800'}"
				>
					{contractType.direction === 'both' ? 'Receivable/Payable' : contractType.direction}
				</span>
			</div>
			<p class="text-sm text-gray-600">{contractType.description}</p>
		</button>
	{/each}
</div>
