<script lang="ts">
	/**
	 * CounterpartyInfoSection - Display-only component for counterparty/client information
	 * 
	 * Used in contract previews to display the other party's information.
	 * Supports different data structures from different contract types.
	 */

	interface CounterpartyDisplayData {
		// Common fields
		name?: string;
		companyName?: string;
		email?: string;
		phone?: string;
		address?: string;
		taxCode?: string;
		taxId?: string;
		idDocument?: string;
		
		// Representative info
		representativeName?: string;
		representativePosition?: string;
		
		// Bilingual support (for Event Planning contracts)
		companyEnglish?: string;
		companyVietnamese?: string;
		addressEnglish?: string;
		addressVietnamese?: string;
		representativePositionEnglish?: string;
		representativePositionVietnamese?: string;
	}

	interface Props {
		data: CounterpartyDisplayData;
		title?: string;
		showTitle?: boolean;
		bilingual?: boolean; // If true, shows English/Vietnamese format
	}

	let { data, title = 'Counterparty Information', showTitle = true, bilingual = false }: Props = $props();
</script>

<div class="mb-6">
	{#if showTitle}
		<h2 class="text-lg font-semibold mb-3">{title}</h2>
	{/if}
	<div class="space-y-1 text-sm leading-relaxed">
		{#if bilingual && data.companyEnglish}
			<p>
				<strong>Company:</strong> {data.companyEnglish} / {data.companyVietnamese || ''}
			</p>
		{:else if data.companyName}
			<p><strong>Company Name:</strong> {data.companyName}</p>
		{:else if data.name}
			<p><strong>Name:</strong> {data.name}</p>
		{/if}

		{#if bilingual && data.addressEnglish}
			<p>
				<strong>Address:</strong> {data.addressEnglish} / {data.addressVietnamese || ''}
			</p>
		{:else if data.address}
			<p><strong>Address:</strong> {data.address}</p>
		{/if}

		{#if data.email}
			<p><strong>Email:</strong> {data.email}</p>
		{/if}

		{#if data.phone}
			<p><strong>Phone:</strong> {data.phone}</p>
		{/if}

		{#if data.taxCode}
			<p><strong>Tax Code:</strong> {data.taxCode}</p>
		{/if}

		{#if data.taxId}
			<p><strong>Tax ID:</strong> {data.taxId}</p>
		{/if}

		{#if data.idDocument}
			<p><strong>ID Document:</strong> {data.idDocument}</p>
		{/if}

		{#if data.representativeName}
			<p>
				<strong>Representative:</strong> {data.representativeName}
			</p>
		{/if}

		{#if bilingual && data.representativePositionEnglish}
			<p>
				<strong>Position:</strong> {data.representativePositionEnglish} / {data.representativePositionVietnamese || ''}
			</p>
		{:else if data.representativePosition}
			<p><strong>Position:</strong> {data.representativePosition}</p>
		{/if}
	</div>
</div>
