<script lang="ts">
	import type { BaseContract } from '$lib/types/v2';
	import { formatDateString, formatCurrency } from '$lib/utils/formatting';
	import { getContractDateOrCreatedAt } from '$lib/utils/v2/contractDates';
	import { Calendar, Eye, Edit, Download, Trash2 } from 'lucide-svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { authState } from '$lib/state/auth.svelte';

	interface Props {
		contract: BaseContract;
		getLink?: (c: BaseContract) => string;
		getContractTypeLabel: (type: BaseContract['type']) => string;
		getDefaultContractLink: (contract: BaseContract) => string;
		getEditLink: (contract: BaseContract) => string;
		paymentBadgeHref: string | null;
		paymentLabel: string;
		isPaid: boolean;
		isDownloading?: boolean;
		isDeleting?: boolean;
		onDownload?: () => void;
		onDeleteClick?: () => void;
		backgroundColor?: string;
	}

	let {
		contract,
		getLink,
		getContractTypeLabel,
		getDefaultContractLink,
		getEditLink,
		paymentBadgeHref,
		paymentLabel,
		isPaid,
		isDownloading = false,
		isDeleting = false,
		onDownload,
		onDeleteClick,
		backgroundColor = 'bg-white'
	}: Props = $props();
</script>

<div class="space-y-4 py-4 px-4 border border-border rounded-lg {backgroundColor}">
	<!-- Header -->
	<div class="flex items-start justify-between gap-2">
		<div class="flex-1 min-w-0">
			<h3 class="text-base font-bold tracking-tight truncate">
				{contract.counterpartyName}
			</h3>
			<p class="text-sm text-muted-foreground truncate mt-0.5">
				{contract.eventName}
			</p>
			<p class="text-xs text-muted-foreground truncate mt-0.5">
				{contract.contractNumber}
			</p>
		</div>
		<Badge variant="outline" class="shrink-0">
			{getContractTypeLabel(contract.type)}
		</Badge>
	</div>

	<!-- Details -->
	<div class="space-y-1.5 text-sm">
		<div class="flex items-center gap-2 text-muted-foreground">
			<Calendar class="h-3.5 w-3.5 shrink-0" />
			<span class="tracking-wide">
				{formatDateString(getContractDateOrCreatedAt(contract).toISOString())}
			</span>
		</div>
	</div>

	<!-- Value -->
	<div class="pt-1">
		<div class="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
			{formatCurrency(contract.contractValue)}
		</div>
	</div>

	<!-- Actions - All buttons on same line -->
	<div class="pt-4 flex gap-2 flex-wrap">
		<!-- Payment Status Badge -->
		{#if paymentBadgeHref}
			<a href={paymentBadgeHref} class="shrink-0" title="Manage payments">
				{#if isPaid}
					<Badge variant="default" class="py-2 px-3 bg-emerald-500 hover:bg-emerald-600">
						{paymentLabel}
					</Badge>
				{:else}
					<Badge variant="secondary" class="py-2 px-3 hover:bg-slate-200">
						{paymentLabel}
					</Badge>
				{/if}
			</a>
		{:else}
			<span class="shrink-0">
				{#if isPaid}
					<Badge variant="default" class="py-2 px-3 bg-emerald-500">
						{paymentLabel}
					</Badge>
				{:else}
					<Badge variant="secondary" class="py-2 px-3">
						{paymentLabel}
					</Badge>
				{/if}
			</span>
		{/if}

		<Button
			variant="success"
			size="sm"
			href={(getLink ?? getDefaultContractLink)(contract)}
			class="shrink-0"
		>
			<Eye class="h-3.5 w-3.5 mr-1.5" />
			View
		</Button>

		{#if contract.type === 'service-provision' || contract.type === 'event-planning'}
			<Button
				variant="outline"
				size="sm"
				href={getEditLink(contract)}
				class="shrink-0"
			>
				<Edit class="h-3.5 w-3.5 mr-1.5" />
				Edit
			</Button>
			<Button
				variant="outline"
				size="sm"
				onclick={onDownload}
				disabled={isDownloading}
				class="shrink-0"
				title="Download"
			>
				{#if isDownloading}
					<span class="animate-spin mr-1">⏳</span>
				{:else}
					<Download class="h-3.5 w-3.5" />
				{/if}
			</Button>
		{/if}

		{#if contract.type === 'service-provision' || contract.type === 'event-planning'}
			<Button
				variant={authState.isAdmin ? 'destructive' : 'secondary'}
				size="sm"
				onclick={onDeleteClick}
				disabled={!authState.isAdmin || isDeleting}
				class="shrink-0 {!authState.isAdmin
					? 'bg-gray-200 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-700'
					: ''}"
				title={authState.isAdmin ? 'Delete' : 'Only administrators can delete'}
			>
				<Trash2 class="h-3.5 w-3.5" />
			</Button>
		{/if}
	</div>
</div>
