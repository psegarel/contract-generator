<script lang="ts">
	import type { BaseContract } from '$lib/types/v2';
	import { formatDateString, formatCurrency } from '$lib/utils/formatting';
	import { getContractDateOrCreatedAt } from '$lib/utils/v2/contractDates';
	import { Eye, Edit, Download, Trash2 } from '@lucide/svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { authState } from '$lib/state/auth.svelte';
	import { downloadContract, deleteContract } from '$lib/utils/v2';
	import { paymentState } from '$lib/state/v2/paymentState.svelte';
	import ContractCard from './ContractCard.svelte';

	interface Props {
		contract: BaseContract;
		index: number;
		getLink?: (c: BaseContract) => string;
		onDelete?: (contractId: string) => void;
	}

	let { contract, index, getLink, onDelete }: Props = $props();

	let isDownloading = $state(false);
	let isDeleting = $state(false);

	function getContractTypeLabel(type: BaseContract['type']): string {
		const labels: Record<BaseContract['type'], string> = {
			'venue-rental': 'Venue',
			'performer-booking': 'Performer',
			'equipment-rental': 'Equipment',
			'equipment-rental-oneoff': 'Equipment (One-Off)',
			'service-provision': 'Service',
			'event-planning': 'Event Planning',
			subcontractor: 'Subcontractor',
			'client-service': 'Client Service',
			'dj-residency': 'DJ Residency'
		};
		return labels[type];
	}

	function getDefaultContractLink(contract: BaseContract): string {
		return `/contracts/${contract.type}/${contract.id}`;
	}

	function getEditLink(contract: BaseContract): string {
		return `/contracts/${contract.type}/${contract.id}/edit`;
	}

	let contractPayments = $derived(paymentState.getByContract(contract.id));

	let paymentLabel = $derived.by(() => {
		if (contractPayments.length === 0) {
			return contract.paymentStatus === 'paid' ? 'Paid' : 'Unpaid';
		}
		const paidCount = contractPayments.filter((p) => p.status === 'paid').length;
		const total = contractPayments.length;
		if (total === 1) {
			return paidCount === 1 ? 'Paid' : 'Unpaid';
		}
		return `${paidCount}/${total} paid`;
	});

	let paymentBadgeHref = $derived(authState.isAdmin ? `/payments?contract=${contract.id}` : null);

	let isPaid = $derived(contract.paymentStatus === 'paid');

	async function handleDownload() {
		isDownloading = true;
		try {
			await downloadContract(contract);
		} catch (error) {
			// Error already handled in downloadContract with toast
		} finally {
			isDownloading = false;
		}
	}

	async function handleDelete() {
		if (isDeleting) {
			return;
		}

		isDeleting = true;
		try {
			await deleteContract(contract, {
				isAdmin: authState.isAdmin,
				userUid: authState.user?.uid ?? null,
				onDelete
			});
		} catch (error) {
			// Error already handled in deleteContract with toast
		} finally {
			isDeleting = false;
		}
	}
</script>

<div class={index % 2 === 0 ? 'bg-card' : 'bg-muted/30'}>
	<!-- Mobile & Tablet: Card Layout -->
	<div class="xl:hidden">
		<ContractCard
			{contract}
			{getLink}
			{getContractTypeLabel}
			{getDefaultContractLink}
			{getEditLink}
			{paymentBadgeHref}
			{paymentLabel}
			{isPaid}
			{isDownloading}
			{isDeleting}
			onDownload={handleDownload}
			onDeleteClick={handleDelete}
		/>
	</div>

	<!-- Desktop: Grid Layout (18 columns) -->
	<div class="hidden xl:grid grid-cols-20 items-center gap-3 px-2 py-3">
		<!-- Contract Number -->
		<div class="col-span-3 min-w-0 px-2">
			<h3 class="text-sm font-bold tracking-tight truncate">
				{contract.contractNumber}
			</h3>
		</div>

		<!-- Event Name -->
		<div class="col-span-2 min-w-0 px-2 text-sm truncate">
			{contract.eventName}
		</div>

		<!-- Counterparty Name -->
		<div class="col-span-3 min-w-0 px-2 text-sm truncate">
			{contract.counterpartyName}
		</div>

		<!-- Contract Value -->
		<div
			class="col-span-2 min-w-0 px-2 text-right text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400"
		>
			{formatCurrency(contract.contractValue)}
		</div>

		<!-- Date -->
		<div class="col-span-2 min-w-0 px-2 text-center text-sm tracking-wide">
			{formatDateString(getContractDateOrCreatedAt(contract).toISOString())}
		</div>

		<!-- Type Badge -->
		<div class="col-span-2 flex min-w-0 justify-center px-2">
			<Badge variant="outline">
				{getContractTypeLabel(contract.type)}
			</Badge>
		</div>

		<!-- Payment Badge -->
		<div class="col-span-2 flex min-w-0 justify-center px-2">
			{#if paymentBadgeHref}
				<a href={paymentBadgeHref} title="Manage payments">
					{#if isPaid}
						<Badge variant="default" class="bg-emerald-500 hover:bg-emerald-600"
							>{paymentLabel}</Badge
						>
					{:else}
						<Badge variant="secondary" class="hover:bg-accent">{paymentLabel}</Badge>
					{/if}
				</a>
			{:else if isPaid}
				<Badge variant="default" class="bg-emerald-500">{paymentLabel}</Badge>
			{:else}
				<Badge variant="secondary">{paymentLabel}</Badge>
			{/if}
		</div>

		<!-- Actions -->
		<div class="col-span-3 flex min-w-0 justify-center gap-2 px-2">
			<Button
				variant="success"
				size="sm"
				href={(getLink ?? getDefaultContractLink)(contract)}
				class="px-2"
				title="View"
			>
				<Eye class="h-4 w-4" />
			</Button>
			{#if contract.type === 'service-provision' || contract.type === 'event-planning' || contract.type === 'equipment-rental' || contract.type === 'equipment-rental-oneoff' || contract.type === 'dj-residency'}
				<Button variant="outline" size="sm" href={getEditLink(contract)} class="px-2" title="Edit">
					<Edit class="h-4 w-4" />
				</Button>
				<Button
					variant="outline"
					size="sm"
					onclick={handleDownload}
					disabled={isDownloading}
					class="px-2"
					title="Download"
				>
					{#if isDownloading}
						<span class="animate-spin">⏳</span>
					{:else}
						<Download class="h-4 w-4" />
					{/if}
				</Button>
			{/if}
		</div>

		<!-- Delete Button -->
		{#if contract.type === 'service-provision' || contract.type === 'event-planning' || contract.type === 'equipment-rental' || contract.type === 'equipment-rental-oneoff' || contract.type === 'dj-residency'}
			<div class="col-span-1 flex min-w-0 justify-center px-2">
				<Button
					variant={authState.isAdmin ? 'destructive' : 'secondary'}
					size="sm"
					onclick={handleDelete}
					disabled={!authState.isAdmin || isDeleting}
					class="px-2 {!authState.isAdmin
						? 'bg-muted hover:bg-muted'
						: 'bg-red-600 hover:bg-red-700 text-white hover:text-white'}"
					title={authState.isAdmin ? 'Delete' : 'Only administrators can delete'}
				>
					<Trash2 class="h-4 w-4" />
				</Button>
			</div>
		{:else}
			<div class="col-span-1 px-2"></div>
		{/if}
	</div>
</div>
