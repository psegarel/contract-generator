<script lang="ts">
	import { onMount } from 'svelte';
	import type { Timestamp } from 'firebase/firestore';
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
		<label for={id} class="block text-sm font-medium text-gray-700 mb-1">
			{label}
			{#if required}<span class="text-red-500">*</span>{/if}
		</label>
	{/if}

	<div class="relative">
		<input
			{id}
			type="text"
			value={value}
			oninput={handleInput}
			onfocus={() => (isOpen = true)}
			onblur={() => setTimeout(() => (isOpen = false), 150)}
			{required}
			{placeholder}
			autocomplete="off"
			class="w-full px-3.5 py-2.5 border rounded-md text-foreground placeholder:text-muted-foreground/30 focus:ring-2 focus:outline-none focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm {error
				? 'border-red-500 focus:ring-red-500/10'
				: 'border-gray-300'}"
		/>

		{#if isOpen && banks.length > 0}
			<div
				class="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg"
			>
				<ul class="max-h-48 overflow-y-auto py-1">
					{#if filtered.length === 0}
						<li class="px-3.5 py-2 text-sm text-gray-500 italic">No matching banks</li>
					{:else}
						{#each filtered as bank (bank)}
							<li>
								<button
									type="button"
									onmousedown={() => selectBank(bank)}
									class="w-full text-left px-3.5 py-2 text-sm {value === bank
										? 'bg-blue-50 text-blue-700 font-medium'
										: 'text-gray-900 hover:bg-gray-50'}"
								>
									{bank}
								</button>
							</li>
						{/each}
					{/if}
				</ul>

				<div class="border-t border-gray-100 px-3.5 py-2 flex items-center justify-between">
					<span class="text-xs text-gray-400">
						{#if loadError}
							{loadError}
						{:else}
							Updated {formatLastRefreshed(lastRefreshed)}
						{/if}
					</span>
					<button
						type="button"
						onmousedown={handleRefresh}
						disabled={isRefreshing}
						class="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
					>
						{isRefreshing ? 'Refreshing...' : 'Refresh list'}
					</button>
				</div>
			</div>
		{/if}
	</div>

	{#if error}
		<p class="text-xs text-red-500 m-0">{error}</p>
	{/if}
</div>
