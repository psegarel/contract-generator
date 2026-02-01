<script lang="ts">
	import { companyConfig } from '$lib/config/company';

	interface Props {
		title?: string;
		showTitle?: boolean;
	}

	let { title = 'Company Information (Party A)', showTitle = true }: Props = $props();
</script>

<div class="mb-6">
	{#if showTitle}
		<h2 class="text-lg font-semibold mb-3">{title}</h2>
	{/if}
	<div class="space-y-1 text-sm leading-relaxed">
		<p><strong>Company Name:</strong> {companyConfig.name}</p>
		{#if companyConfig.nameVietnamese}
			<p><strong>Company Name (Vietnamese):</strong> {companyConfig.nameVietnamese}</p>
		{/if}
		<p>
			<strong>Address:</strong> {companyConfig.addressLine1}, {companyConfig.addressLine2}, {companyConfig.ward}, {companyConfig.city}
		</p>
		<p><strong>Tax Code:</strong> {companyConfig.taxCode}</p>
		<p>
			<strong>Representative:</strong> {companyConfig.representative}
		</p>
		<p><strong>Phone:</strong> {companyConfig.representativePhone}</p>
		<p><strong>Email:</strong> {companyConfig.representativeEmail}</p>
	</div>
</div>
