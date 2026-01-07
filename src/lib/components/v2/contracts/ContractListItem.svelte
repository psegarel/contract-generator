<script lang="ts">
	import type { BaseContract } from '$lib/types/v2';
	import { formatDateString, formatCurrency } from '$lib/utils/formatting';
	import { Calendar, User, Pencil, Download, Trash2 } from 'lucide-svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { authState } from '$lib/state/auth.svelte';
	import { toast } from 'svelte-sonner';
	import {
		updateServiceProvisionContractPaymentStatus,
		updateEventPlanningContractPaymentStatus,
		updateVenueRentalContractPaymentStatus,
		updatePerformerBookingContractPaymentStatus,
		updateEquipmentRentalContractPaymentStatus,
		updateSubcontractorContractPaymentStatus,
		updateClientServiceContractPaymentStatus,
		downloadContract,
		deleteContract
	} from '$lib/utils/v2';
	import ContractCard from './ContractCard.svelte';

	interface Props {
		contract: BaseContract;
		index: number;
		getLink?: (c: BaseContract) => string;
		onPaymentStatusUpdate?: (contract: BaseContract) => void;
		onDelete?: (contractId: string) => void;
	}

	let { contract, index, getLink, onPaymentStatusUpdate, onDelete }: Props = $props();

	let isMarkingAsPaid = $state(false);
	let isDownloading = $state(false);
	let isDeleting = $state(false);

	function getContractTypeLabel(type: BaseContract['type']): string {
		const labels: Record<BaseContract['type'], string> = {
			'venue-rental': 'Venue',
			'performer-booking': 'Performer',
			'equipment-rental': 'Equipment',
			'service-provision': 'Service',
			'event-planning': 'Event Planning',
			subcontractor: 'Subcontractor',
			'client-service': 'Client Service'
		};
		return labels[type];
	}

	function getDefaultContractLink(contract: BaseContract): string {
		return `/contracts/${contract.type}/${contract.id}`;
	}

	async function togglePaymentStatus() {
		if (!authState.user?.uid) {
			toast.error('You must be logged in to update payment status');
			return;
		}

		isMarkingAsPaid = true;

		try {
			let updateFunction: (
				contractId: string,
				status: 'unpaid' | 'paid',
				adminUid: string
			) => Promise<void>;

			switch (contract.type) {
				case 'service-provision':
					updateFunction = updateServiceProvisionContractPaymentStatus;
					break;
				case 'event-planning':
					updateFunction = updateEventPlanningContractPaymentStatus;
					break;
				case 'venue-rental':
					updateFunction = updateVenueRentalContractPaymentStatus;
					break;
				case 'performer-booking':
					updateFunction = updatePerformerBookingContractPaymentStatus;
					break;
				case 'equipment-rental':
					updateFunction = updateEquipmentRentalContractPaymentStatus;
					break;
				case 'subcontractor':
					updateFunction = updateSubcontractorContractPaymentStatus;
					break;
				case 'client-service':
					updateFunction = updateClientServiceContractPaymentStatus;
					break;
				default:
					throw new Error(`Unknown contract type: ${contract.type}`);
			}

			const newStatus: 'unpaid' | 'paid' = contract.paymentStatus === 'paid' ? 'unpaid' : 'paid';
			await updateFunction(contract.id, newStatus, authState.user.uid);

			// Update local contract state
			const updatedContract: BaseContract = {
				...contract,
				paymentStatus: newStatus,
				paidAt: newStatus === 'paid' ? (new Date() as any) : null,
				paidBy: newStatus === 'paid' ? authState.user.uid : null
			};

			if (onPaymentStatusUpdate) {
				onPaymentStatusUpdate(updatedContract);
			}

			toast.success(`Contract marked as ${newStatus}`);
		} catch (error) {
			console.error('Error updating payment status:', error);
			toast.error('Failed to update payment status');
		} finally {
			isMarkingAsPaid = false;
		}
	}

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

<div class={index % 2 === 0 ? 'bg-white' : 'bg-slate-100/80'}>
	<!-- Mobile: Stacked Layout -->
	<div class="md:hidden space-y-4 py-3">
		<!-- Title and Type Badge -->
		<div class="flex items-start justify-between gap-3">
			<h3 class="text-xl font-bold leading-tight flex-1 tracking-tight">
				{contract.eventName}
			</h3>
			<Badge variant="outline" class="shrink-0">
				{getContractTypeLabel(contract.type)}
			</Badge>
		</div>

		<!-- Details -->
		<div class="space-y-2 text-sm text-muted-foreground">
			<div class="flex items-center gap-2.5">
				<Calendar class="h-4 w-4 shrink-0" />
				<span class="tracking-wide"
					>{formatDateString(contract.createdAt.toDate().toISOString())}</span
				>
			</div>
			<div class="flex items-center gap-2.5">
				<User class="h-4 w-4 shrink-0" />
				<span class="truncate">{contract.counterpartyName}</span>
			</div>
		</div>

		<!-- Value -->
		<div class="pt-1">
			<div class="text-base font-bold text-emerald-600 dark:text-emerald-400">
				{formatCurrency(contract.contractValue)}
			</div>
		</div>

		<!-- Actions -->
		<div class="pt-2 space-y-2">
			<button
				onclick={togglePaymentStatus}
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
			<Button
				variant="outline"
				size="sm"
				href={(getLink ?? getDefaultContractLink)(contract)}
				class="w-full"
			>
				<Pencil class="h-3.5 w-3.5 mr-1.5" />
				View
			</Button>
			{#if contract.type === 'service-provision' || contract.type === 'event-planning'}
				<Button
					variant="outline"
					size="sm"
					onclick={handleDownload}
					disabled={isDownloading}
					class="w-full"
				>
					{#if isDownloading}
						<span class="animate-spin mr-1.5">⏳</span>
						Downloading...
					{:else}
						<Download class="h-3.5 w-3.5 mr-1.5" />
						Download
					{/if}
				</Button>
			{/if}
			{#if contract.type === 'service-provision' || contract.type === 'event-planning'}
				<Button
					variant={authState.isAdmin ? 'destructive' : 'secondary'}
					size="sm"
					onclick={handleDelete}
					disabled={!authState.isAdmin || isDeleting}
					class="w-full {!authState.isAdmin
						? 'bg-gray-200 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-700'
						: ''}"
					title={authState.isAdmin ? 'Delete contract' : 'Only administrators can delete contracts'}
				>
					<Trash2 class="h-3.5 w-3.5 mr-1.5" />
					{isDeleting ? 'Deleting...' : 'Delete'}
				</Button>
			{/if}
		</div>
	</div>

	<!-- Tablet: Card Layout -->
	<div class="hidden md:block xl:hidden">
		<ContractCard
			{contract}
			{getLink}
			{getContractTypeLabel}
			{getDefaultContractLink}
			{isMarkingAsPaid}
			{isDownloading}
			{isDeleting}
			onTogglePaymentStatus={togglePaymentStatus}
			onDownload={handleDownload}
			onDeleteClick={handleDelete}
		/>
	</div>

	<!-- Desktop: Grid Layout (18 columns) -->
	<div class="hidden xl:grid grid-cols-18 gap-3 items-center py-3">
		<!-- Contract Number -->
		<div class="col-span-2 px-1">
			<h3 class="text-sm font-bold tracking-tight truncate">
				{contract.contractNumber}
			</h3>
		</div>

		<!-- Event Name -->
		<div class="col-span-2 px-1 text-sm truncate">
			{contract.eventName}
		</div>

		<!-- Counterparty Name -->
		<div class="col-span-3 px-1 text-sm truncate">
			{contract.counterpartyName}
		</div>

		<!-- Contract Value -->
		<div
			class="col-span-2 px-1 text-sm font-bold text-emerald-600 dark:text-emerald-400 text-right tabular-nums"
		>
			{formatCurrency(contract.contractValue)}
		</div>

		<!-- Date -->
		<div class="col-span-2 px-1 text-sm text-center tracking-wide">
			{formatDateString(contract.createdAt.toDate().toISOString())}
		</div>

		<!-- Type Badge -->
		<div class="col-span-2 px-1 flex justify-center">
			<Badge variant="outline">
				{getContractTypeLabel(contract.type)}
			</Badge>
		</div>

		<!-- Payment Toggle Badge -->
		<div class="col-span-2 px-1 flex justify-center">
			<button
				onclick={togglePaymentStatus}
				disabled={isMarkingAsPaid}
				class="cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
				title={contract.paymentStatus === 'paid'
					? 'Click to mark as Unpaid'
					: 'Click to mark as Paid'}
			>
				{#if contract.paymentStatus === 'paid'}
					<Badge variant="default" class="bg-emerald-500 hover:bg-emerald-600">Paid</Badge>
				{:else}
					<Badge variant="secondary">Unpaid</Badge>
				{/if}
			</button>
		</div>

		<!-- Actions -->
		<div class="col-span-2 px-1 flex gap-2 justify-center">
			<Button
				variant="outline"
				size="sm"
				href={(getLink ?? getDefaultContractLink)(contract)}
				class="px-2"
				title="View"
			>
				<Pencil class="h-4 w-4" />
			</Button>
			{#if contract.type === 'service-provision' || contract.type === 'event-planning'}
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
		{#if contract.type === 'service-provision' || contract.type === 'event-planning'}
			<div class="col-span-1 px-1 flex justify-center">
				<Button
					variant={authState.isAdmin ? 'destructive' : 'secondary'}
					size="sm"
					onclick={handleDelete}
					disabled={!authState.isAdmin || isDeleting}
					class="px-2 {!authState.isAdmin
						? 'bg-gray-200 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-700'
						: ''}"
					title={authState.isAdmin ? 'Delete' : 'Only administrators can delete'}
				>
					<Trash2 class="h-4 w-4" />
				</Button>
			</div>
		{:else}
			<div class="col-span-1 px-1"></div>
		{/if}
	</div>
</div>
