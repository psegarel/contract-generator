<script lang="ts">
	import type { BaseContract } from '$lib/types/v2';
	import type { ServiceProvisionContract } from '$lib/types/v2/contracts';
	import { formatDateString, formatCurrency } from '$lib/utils/formatting';
	import { Calendar, User, Pencil, Check, Download } from 'lucide-svelte';
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
		updateClientServiceContractPaymentStatus
	} from '$lib/utils/v2';
	import { generateServiceContract } from '$lib/utils/serviceContractGenerator';

	interface Props {
		contract: BaseContract;
		index: number;
		getLink?: (c: BaseContract) => string;
		onPaymentStatusUpdate?: (contract: BaseContract) => void;
	}

	let { contract, index, getLink, onPaymentStatusUpdate }: Props = $props();

	let isMarkingAsPaid = $state(false);
	let isDownloading = $state(false);

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
			let updateFunction: (contractId: string, status: 'unpaid' | 'paid', adminUid: string) => Promise<void>;

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
		if (contract.type !== 'service-provision') {
			toast.error('Download is only available for service-provision contracts');
			return;
		}

		isDownloading = true;

		try {
			const serviceContract = contract as ServiceProvisionContract;

			// Validate required fields
			if (!serviceContract.eventName) {
				toast.error('Event name is required for download');
				return;
			}

			// Convert ServiceProvisionContract to ContractData format
			const contractData = {
				clientName: serviceContract.counterpartyName,
				clientEmail: serviceContract.clientEmail,
				clientAddress: serviceContract.clientAddress,
				clientPhone: serviceContract.clientPhone,
				clientIdDocument: serviceContract.clientIdDocument,
				clientTaxId: serviceContract.clientTaxId || undefined,
				jobName: serviceContract.jobName,
				eventName: serviceContract.eventName,
				numberOfPerformances: serviceContract.numberOfPerformances,
				eventLocation: serviceContract.eventLocation,
				firstPerformanceTime: serviceContract.firstPerformanceTime,
				jobContent: serviceContract.jobContent,
				bankName: serviceContract.bankName,
				accountNumber: serviceContract.accountNumber,
				netFee: serviceContract.netFee,
				taxRate: serviceContract.taxRate,
				startDate: serviceContract.startDate,
				endDate: serviceContract.endDate
			};

			const blob = await generateServiceContract(contractData);
			const filename = `Contract_${serviceContract.counterpartyName.replace(/\s+/g, '_')}.docx`;

			// Try File System Access API
			if ('showSaveFilePicker' in window) {
				try {
					// @ts-expect-error - showSaveFilePicker is not yet in standard TS lib
					const handle = await window.showSaveFilePicker({
						suggestedName: filename,
						types: [
							{
								description: 'Word Document',
								accept: {
									'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
										'.docx'
									]
								}
							}
						]
					});
					const writable = await handle.createWritable();
					await writable.write(blob);
					await writable.close();
					toast.success('Contract downloaded successfully!');
					return;
				} catch (err) {
					if (err && typeof err === 'object' && 'name' in err && err.name === 'AbortError') {
						return;
					}
				}
			}

			// Fallback download
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
			toast.success('Contract downloaded successfully!');
		} catch (error) {
			console.error('Error downloading contract:', error);
			toast.error('Failed to download contract');
		} finally {
			isDownloading = false;
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

		<!-- Value and Status -->
		<div class="flex items-center justify-between pt-1">
			<div class="text-base font-bold text-emerald-600 dark:text-emerald-400">
				{formatCurrency(contract.contractValue)}
			</div>
			<div class="flex gap-2">
				{#if contract.paymentStatus === 'paid'}
					<Badge variant="default" class="bg-emerald-500 hover:bg-emerald-600">Paid</Badge>
				{:else}
					<Badge variant="secondary">Unpaid</Badge>
				{/if}
			</div>
		</div>

		<!-- Actions -->
		<div class="pt-2 space-y-2">
			<Button
				size="sm"
				onclick={togglePaymentStatus}
				disabled={isMarkingAsPaid}
				class="w-full {contract.paymentStatus === 'paid'
					? 'bg-gray-600 hover:bg-gray-700'
					: 'bg-emerald-600 hover:bg-emerald-700'} text-white"
			>
				<Check class="h-3.5 w-3.5 mr-1.5" />
				{isMarkingAsPaid
					? 'Updating...'
					: contract.paymentStatus === 'paid'
						? 'Mark as Unpaid'
						: 'Mark as Paid'}
			</Button>
			<Button size="sm" href={(getLink ?? getDefaultContractLink)(contract)} class="w-full">
				<Pencil class="h-3.5 w-3.5 mr-1.5" />
				View
			</Button>
			{#if contract.type === 'service-provision'}
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
		</div>
	</div>

	<!-- Desktop: Grid Layout (18 columns) -->
	<div class="hidden md:grid grid-cols-18 gap-3 items-center py-3 px-4">
		<!-- Contract Number -->
		<div class="col-span-2">
			<h3 class="text-sm font-bold tracking-tight truncate">
				{contract.contractNumber}
			</h3>
		</div>

		<!-- Event Name -->
		<div class="col-span-3 text-sm truncate">
			{contract.eventName}
		</div>

		<!-- Counterparty Name -->
		<div class="col-span-3 text-sm truncate">
			{contract.counterpartyName}
		</div>

		<!-- Contract Value -->
		<div
			class="col-span-2 text-sm font-bold text-emerald-600 dark:text-emerald-400 text-right tabular-nums"
		>
			{formatCurrency(contract.contractValue)}
		</div>

		<!-- Date -->
		<div class="col-span-2 text-sm text-center tracking-wide">
			{formatDateString(contract.createdAt.toDate().toISOString())}
		</div>

		<!-- Type Badge -->
		<div class="col-span-1 flex justify-center">
			<Badge variant="outline">
				{getContractTypeLabel(contract.type)}
			</Badge>
		</div>

		<!-- Payment Status Badge -->
		<div class="col-span-1 flex justify-center">
			{#if contract.paymentStatus === 'paid'}
				<Badge variant="default" class="bg-emerald-500 hover:bg-emerald-600">Paid</Badge>
			{:else}
				<Badge variant="secondary">Unpaid</Badge>
			{/if}
		</div>

		<!-- Payment Toggle Button -->
		<div class="col-span-2 flex justify-center">
			<Button
				size="sm"
				onclick={togglePaymentStatus}
				disabled={isMarkingAsPaid}
				class="px-2 {contract.paymentStatus === 'paid'
					? 'bg-gray-600 hover:bg-gray-700'
					: 'bg-emerald-600 hover:bg-emerald-700'} text-white"
				title={contract.paymentStatus === 'paid' ? 'Mark as Unpaid' : 'Mark as Paid'}
			>
				<Check class="h-4 w-4" />
			</Button>
		</div>

		<!-- Actions -->
		<div class="col-span-2 flex gap-2 justify-center">
			<Button size="sm" href={(getLink ?? getDefaultContractLink)(contract)} class="px-2" title="View">
				<Pencil class="h-4 w-4" />
			</Button>
			{#if contract.type === 'service-provision'}
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
	</div>
</div>
