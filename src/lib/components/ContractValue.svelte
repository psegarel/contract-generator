<script lang="ts">
	interface Props {
		totalContractValue: number;
		isLoading?: boolean;
		error?: string | null;
		title?: string;
		class?: string;
	}

	let {
		totalContractValue,
		isLoading = false,
		error = null,
		title = 'Total Contracts Value',
		class: className = ''
	}: Props = $props();

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
	};
</script>

<div class={className}>
	<h3 class="mb-1 text-xs font-semibold uppercase tracking-wider">
		{title}
	</h3>
	{#if isLoading}
		<div class="bg-muted h-9 w-32 animate-pulse rounded"></div>
	{:else if error}
		<div class="text-destructive text-sm">Error: {error}</div>
	{:else}
		<div class="text-3xl font-bold">{formatCurrency(totalContractValue)}</div>
	{/if}
</div>
