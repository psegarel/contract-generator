<script lang="ts">
	import { onMount } from 'svelte';
	import type { Timestamp } from 'firebase/firestore';
	import { Button } from '$lib/components/ui/button';
	import { getBankConfig, refreshBankList } from '$lib/utils/v2/appConfig';
	import { logger } from '$lib/utils/logger';

	interface Props {
		id?: string;
		label?: string;
		value?: string;
		required?: boolean;
		placeholder?: string;
		error?: string;
	}

	let {
		id = 'bankName',
		label = 'Bank Name',
		value = $bindable(''),
		required = false,
		placeholder = 'Select or type a bank name',
		error = ''
	}: Props = $props();

	let banks = $state<string[]>([]);
	let lastRefreshed = $state<Timestamp | null>(null);
	let isOpen = $state(false);
	let isRefreshing = $state(false);
	let loadError = $state<string | null>(null);

	let filtered = $derived(
		value ? banks.filter((b) => b.toLowerCase().includes(value.toLowerCase())) : banks
	);

	onMount(async () => {
		try {
			const config = await getBankConfig();
			banks = config.banks;
			lastRefreshed = config.lastRefreshed;
		} catch (e) {
			logger.error('Failed to load bank list', e);
			loadError = 'Could not load bank list';
		}
	});

	function selectBank(bank: string) {
		value = bank;
		isOpen = false;
	}

	function handleInput(e: Event) {
		value = (e.target as HTMLInputElement).value;
		isOpen = true;
	}

	async function handleRefresh() {
		isRefreshing = true;
		loadError = null;
		try {
			const result = await refreshBankList();
			banks = result.banks;
			lastRefreshed = result.lastRefreshed;
		} catch (e) {
			logger.error('Failed to refresh bank list', e);
			loadError = 'Refresh failed';
		} finally {
			isRefreshing = false;
		}
	}

	function formatLastRefreshed(ts: Timestamp | null): string {
		if (!ts) return 'never';
		const days = Math.floor((Date.now() - ts.toDate().getTime()) / 86_400_000);
		if (days === 0) return 'today';
		if (days === 1) return 'yesterday';
		return `${days} days ago`;
	}
</script>

<div class="flex flex-col gap-1">
	{#if label}
		<label for={id} class="block text-sm font-medium text-foreground mb-1">
			{label}
			{#if required}<span class="text-destructive">*</span>{/if}
		</label>
	{/if}

	<div class="relative">
		<input
			{id}
			type="text"
			{value}
			oninput={handleInput}
			onfocus={() => (isOpen = true)}
			onblur={() => setTimeout(() => (isOpen = false), 150)}
			{required}
			{placeholder}
			autocomplete="off"
			class="w-full px-3.5 py-2.5 border rounded-md text-foreground placeholder:text-muted-foreground/30 focus:ring-2 focus:outline-none focus:ring-ring focus:border-ring transition-all text-sm {error
				? 'border-destructive focus:ring-destructive/10'
				: 'border-input'}"
		/>

		{#if isOpen && banks.length > 0}
			<div class="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg">
				<ul class="max-h-48 overflow-y-auto py-1">
					{#if filtered.length === 0}
						<li class="px-3.5 py-2 text-sm text-muted-foreground italic">No matching banks</li>
					{:else}
						{#each filtered as bank (bank)}
							<li>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									class="h-auto w-full justify-start rounded-none px-3.5 py-2 text-left text-sm {value ===
									bank
										? 'bg-primary/10 text-primary font-medium'
										: 'text-foreground hover:bg-accent'}"
									onmousedown={() => selectBank(bank)}
								>
									{bank}
								</Button>
							</li>
						{/each}
					{/if}
				</ul>

				<div class="border-t border-border px-3.5 py-2 flex items-center justify-between">
					<span class="text-xs text-muted-foreground">
						{#if loadError}
							{loadError}
						{:else}
							Updated {formatLastRefreshed(lastRefreshed)}
						{/if}
					</span>
					<Button
						type="button"
						variant="link"
						size="sm"
						class="h-auto p-0 text-xs"
						onmousedown={handleRefresh}
						disabled={isRefreshing}
					>
						{isRefreshing ? 'Refreshing...' : 'Refresh list'}
					</Button>
				</div>
			</div>
		{/if}
	</div>

	{#if error}
		<p class="text-xs text-destructive m-0">{error}</p>
	{/if}
</div>
