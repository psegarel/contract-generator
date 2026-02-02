<script lang="ts">
	import type { BaseContract } from '$lib/types/v2';
	import { formatDateString, formatCurrency } from '$lib/utils/formatting';
	import { Eye, Edit, Download, Trash2 } from 'lucide-svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { authState } from '$lib/state/auth.svelte';
	import { toast } from 'svelte-sonner';
	import { logger } from '$lib/utils/logger';
	import {
		updateServiceProvisionContractPaymentStatus,
		updateEventPlanningContractPaymentStatus,
		updateVenueRentalContractPaymentStatus,
		updatePerformerBookingContractPaymentStatus,
		updateEquipmentRentalContractPaymentStatus,
		updateSubcontractorContractPaymentStatus,
		updateClientServiceContractPaymentStatus,
		downloadContract,
		deleteContract,
		syncContractPaymentStatus
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

	function getEditLink(contract: BaseContract): string {
		return `/contracts/${contract.type}/${contract.id}/edit`;
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

			// Sync payment records
			await syncContractPaymentStatus(contract, newStatus, authState.user.uid);

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
			logger.error('Error updating payment status:', error);
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
	<!-- Mobile & Tablet: Card Layout -->
	<div class="xl:hidden">
		<ContractCard
			{contract}
			{getLink}
			{getContractTypeLabel}
			{getDefaultContractLink}
			getEditLink={getEditLink}
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
				variant="success"
				size="sm"
				href={(getLink ?? getDefaultContractLink)(contract)}
				class="px-2"
				title="View"
			>
				<Eye class="h-4 w-4" />
			</Button>
			{#if contract.type === 'service-provision' || contract.type === 'event-planning' || contract.type === 'equipment-rental'}
				<Button
					variant="outline"
					size="sm"
					href={getEditLink(contract)}
					class="px-2"
					title="Edit"
				>
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
		{#if contract.type === 'service-provision' || contract.type === 'event-planning' || contract.type === 'equipment-rental'}
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
