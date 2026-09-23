<script lang="ts">
	import { Button } from '$lib/components/ui/button';
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
			value: 'equipment-rental-oneoff',
			label: 'Equipment Rental (One-Off)',
			description: 'One-off equipment rental with external quotation reference',
			direction: 'receivable'
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
		},
		{
			value: 'dj-residency',
			label: 'DJ Residency',
			description: 'Framework agreement for regular DJ performances at a venue',
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
		<Button
			type="button"
			onclick={() => handleSelect(contractType.value)}
			class="h-auto w-full flex-col items-start justify-start rounded-sm p-4 text-left {selectedType ===
			contractType.value
				? 'bg-primary/10 text-foreground'
				: 'bg-card hover:bg-muted'}"
		>
			<div class="mb-2 flex w-full items-start justify-between gap-2">
				<h3 class="font-semibold text-foreground">{contractType.label}</h3>
				<span
					class="rounded-full px-2 py-1 text-xs {contractType.direction === 'receivable'
						? 'bg-emerald-100 text-emerald-800'
						: contractType.direction === 'payable'
							? 'bg-red-100 text-red-800'
							: 'bg-blue-100 text-blue-800'}"
				>
					{contractType.direction === 'both' ? 'Receivable/Payable' : contractType.direction}
				</span>
			</div>
			<p class="text-sm text-muted-foreground">{contractType.description}</p>
		</Button>
	{/each}
</div>
