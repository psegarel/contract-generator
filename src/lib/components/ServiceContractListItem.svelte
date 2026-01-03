<script lang="ts">
	import type { SavedServiceContract } from '$lib/utils/serviceContracts';
	import { formatDateString, formatCurrency } from '$lib/utils/formatting';
	import { Download, Pencil, DollarSign, MapPin, User, Calendar } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';

	interface Props {
		contract: SavedServiceContract;
		isDownloading?: boolean;
		isUpdatingPayment?: boolean;
		showAdminActions?: boolean;
		onDownload?: () => void;
		onTogglePayment?: () => void;
	}

	let {
		contract,
		isDownloading = false,
		isUpdatingPayment = false,
		showAdminActions = false,
		onDownload,
		onTogglePayment
	}: Props = $props();
</script>

<div class="py-2 border-b border-dotted border-border">
	<!-- Mobile: Stacked Layout -->
	<div class="md:hidden space-y-4">
		<!-- Title and Badges -->
		<div class="flex items-start justify-between gap-3">
			<h3 class="text-xl font-bold leading-tight flex-1 tracking-tight">
				{contract.contractData.eventName}
			</h3>
			<div class="flex gap-2 shrink-0">
				{#if contract.status === 'draft'}
					<Badge variant="outline" class="border-amber-500 text-amber-600 dark:text-amber-400">
						Draft
					</Badge>
				{/if}
				{#if contract.paymentStatus === 'paid'}
					<Badge variant="default" class="bg-emerald-500 hover:bg-emerald-600">Paid</Badge>
				{:else}
					<Badge variant="secondary">Unpaid</Badge>
				{/if}
			</div>
		</div>

		<!-- Details -->
		<div class="space-y-2 text-sm text-muted-foreground">
			<div class="flex items-center gap-2.5">
				<Calendar class="h-4 w-4 shrink-0" />
				<span class="tracking-wide">{formatDateString(contract.contractData.startDate)}</span>
			</div>
			<div class="flex items-center gap-2.5">
				<MapPin class="h-4 w-4 shrink-0" />
				<span>{contract.contractData.eventLocation}</span>
			</div>
			<div class="flex items-center gap-2.5">
				<User class="h-4 w-4 shrink-0" />
				<span>{contract.contractData.clientName}</span>
			</div>
		</div>

		<!-- Actions -->
		<div class="flex flex-wrap gap-2 pt-1">
			<Button size="sm" href="/contracts/service?edit={contract.id}" class="flex-1 min-w-25">
				<Pencil class="h-3.5 w-3.5 mr-1.5" />
				Edit
			</Button>
			<Button
				variant="outline"
				size="sm"
				onclick={onDownload}
				disabled={isDownloading}
				class="flex-1 min-w-25"
			>
				{#if isDownloading}
					<span class="animate-spin mr-1.5">⏳</span>
					...
				{:else}
					<Download class="h-3.5 w-3.5 mr-1.5" />
					Download
				{/if}
			</Button>
			{#if showAdminActions}
				<Button
					variant="outline"
					size="sm"
					onclick={onTogglePayment}
					disabled={isUpdatingPayment}
					class="w-full"
				>
					{#if isUpdatingPayment}
						<span class="animate-spin mr-1.5">⏳</span>
						Updating...
					{:else}
						<DollarSign class="h-3.5 w-3.5 mr-1.5" />
						{contract.paymentStatus === 'paid' ? 'Mark Unpaid' : 'Mark Paid'}
					{/if}
				</Button>
			{/if}
		</div>
	</div>

	<!-- Desktop: Dashboard Grid Layout (16 columns for better spacing) -->
	<div class="hidden md:grid grid-cols-16 gap-3 items-center">
		<!-- Event Name -->
		<h3 class="col-span-4 text-base font-bold tracking-tight truncate">
			{contract.contractData.eventName}
		</h3>

		<!-- Client/Staff Name -->
		<div class="col-span-3 text-base truncate">
			{contract.contractData.clientName}
		</div>

		<!-- Service Fee - Right-Aligned -->
		<div
			class="col-span-2 text-base font-bold text-emerald-600 dark:text-emerald-400 text-right tabular-nums"
		>
			{formatCurrency(contract.contractData.netFee)}
		</div>

		<!-- Date -->
		<div class="col-span-2 text-sm text-center tracking-wide text-foreground/70 font-medium">
			{formatDateString(contract.contractData.startDate)}
		</div>

		<!-- Venue/Location -->
		<div class="col-span-2 text-sm text-muted-foreground/60 truncate">
			{contract.contractData.eventLocation}
		</div>

		<!-- Badges & Actions -->
		<div class="col-span-3 flex gap-2 justify-end items-center">
			{#if contract.status === 'draft'}
				<Badge variant="outline" class="border-amber-500 text-amber-600 dark:text-amber-400">
					Draft
				</Badge>
			{/if}
			{#if contract.paymentStatus === 'paid'}
				<Badge variant="default" class="bg-emerald-500 hover:bg-emerald-600">Paid</Badge>
			{:else}
				<Badge variant="secondary">Unpaid</Badge>
			{/if}

			<div class="flex gap-2 pl-2 border-l border-border/50">
				{#if showAdminActions}
					<Button
						variant="outline"
						size="sm"
						onclick={onTogglePayment}
						disabled={isUpdatingPayment}
						class="px-2"
					>
						{#if isUpdatingPayment}
							<span class="animate-spin">⏳</span>
						{:else}
							<DollarSign class="h-4 w-4" />
						{/if}
					</Button>
				{/if}
				<Button size="sm" href="/contracts/service?edit={contract.id}" class="px-2">
					<Pencil class="h-4 w-4" />
				</Button>
				<Button
					variant="outline"
					size="sm"
					onclick={onDownload}
					disabled={isDownloading}
					class="px-2"
				>
					{#if isDownloading}
						<span class="animate-spin">⏳</span>
					{:else}
						<Download class="h-4 w-4" />
					{/if}
				</Button>
			</div>
		</div>
	</div>
</div>
