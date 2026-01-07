<script lang="ts">
	import type { BaseContract } from '$lib/types/v2';
	import { formatDateString, formatCurrency } from '$lib/utils/formatting';
	import { Calendar, User, Pencil, Download, Trash2 } from 'lucide-svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { authState } from '$lib/state/auth.svelte';

	interface Props {
		contract: BaseContract;
		getLink?: (c: BaseContract) => string;
		getContractTypeLabel: (type: BaseContract['type']) => string;
		getDefaultContractLink: (contract: BaseContract) => string;
		isMarkingAsPaid?: boolean;
		isDownloading?: boolean;
		isDeleting?: boolean;
		onTogglePaymentStatus?: () => void;
		onDownload?: () => void;
		onDeleteClick?: () => void;
		backgroundColor?: string;
	}

	let {
		contract,
		getLink,
		getContractTypeLabel,
		getDefaultContractLink,
		isMarkingAsPaid = false,
		isDownloading = false,
		isDeleting = false,
		onTogglePaymentStatus,
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
				{contract.contractNumber}
			</h3>
			<p class="text-sm text-muted-foreground truncate mt-0.5">
				{contract.eventName}
			</p>
		</div>
		<Badge variant="outline" class="shrink-0">
			{getContractTypeLabel(contract.type)}
		</Badge>
	</div>

	<!-- Details -->
	<div class="space-y-1.5 text-sm">
		<div class="flex items-center gap-2 text-muted-foreground">
			<User class="h-3.5 w-3.5 shrink-0" />
			<span class="truncate">{contract.counterpartyName}</span>
		</div>
		<div class="flex items-center gap-2 text-muted-foreground">
			<Calendar class="h-3.5 w-3.5 shrink-0" />
			<span class="tracking-wide">
				{formatDateString(contract.createdAt.toDate().toISOString())}
			</span>
		</div>
	</div>

	<!-- Value -->
	<div class="pt-1">
		<div class="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
			{formatCurrency(contract.contractValue)}
		</div>
	</div>

	<!-- Payment Status -->
	<div class="pt-2">
		<button
			onclick={onTogglePaymentStatus}
			disabled={isMarkingAsPaid}
			class="w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
		>
			{#if isMarkingAsPaid}
				<Badge variant="secondary" class="w-full justify-center py-2">Updating...</Badge>
			{:else if contract.paymentStatus === 'paid'}
				<Badge
					variant="default"
					class="w-full justify-center py-2 bg-emerald-500 hover:bg-emerald-600"
				>
					Paid
				</Badge>
			{:else}
				<Badge variant="secondary" class="w-full justify-center py-2">Unpaid</Badge>
			{/if}
		</button>
	</div>

	<!-- Actions -->
	<div class="pt-2 space-y-2">
		<Button
			variant="outline"
			size="sm"
			href={(getLink ?? getDefaultContractLink)(contract)}
			class="w-full"
		>
			<Pencil class="h-3.5 w-3.5 mr-1.5" />
			View
		</Button>
		<div class="flex gap-2">
			{#if contract.type === 'service-provision' || contract.type === 'event-planning'}
				<Button
					variant="outline"
					size="sm"
					onclick={onDownload}
					disabled={isDownloading}
					class="flex-1"
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
					class="px-3 {!authState.isAdmin
						? 'bg-gray-200 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-700'
						: ''}"
					title={authState.isAdmin ? 'Delete' : 'Only administrators can delete'}
				>
					<Trash2 class="h-3.5 w-3.5" />
				</Button>
			{/if}
		</div>
	</div>
</div>

