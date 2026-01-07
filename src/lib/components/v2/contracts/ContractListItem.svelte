<script lang="ts">
	import type { BaseContract } from '$lib/types/v2';
	import type { ServiceProvisionContract, EventPlanningContract } from '$lib/types/v2/contracts';
	import { formatDateString, formatCurrency } from '$lib/utils/formatting';
	import { Calendar, User, Pencil, Check, Download, Trash2 } from 'lucide-svelte';
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
		deleteServiceProvisionContract,
		deleteEventPlanningContract
	} from '$lib/utils/v2';
	import { generateServiceContract } from '$lib/utils/serviceContractGenerator';
	import { generateEventPlanningContract } from '$lib/utils/eventPlanningContractGenerator';

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
		if (contract.type !== 'service-provision' && contract.type !== 'event-planning') {
			toast.error('Download is only available for service-provision and event-planning contracts');
			return;
		}

		isDownloading = true;

		try {
			if (contract.type === 'service-provision') {
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
			} else if (contract.type === 'event-planning') {
				const eventContract = contract as EventPlanningContract;

				// Validate required fields
				if (!eventContract.eventName) {
					toast.error('Event name is required for download');
					return;
				}

				// Convert EventPlanningContract to EventPlanningContractData format
				const contractData = {
					contractDate: eventContract.contractDate,
					contractLocation: eventContract.contractLocation,
					clientCompany: eventContract.clientCompany,
					clientAddress: eventContract.clientAddress,
					clientTaxCode: eventContract.clientTaxCode,
					clientRepresentativeName: eventContract.clientRepresentativeName,
					clientRepresentativePosition: eventContract.clientRepresentativePosition,
					eventTheme: eventContract.eventTheme || null,
					eventName: eventContract.eventName,
					eventType: eventContract.eventType || null,
					eventDescription: eventContract.eventDescription || null,
					eventVenue: eventContract.eventVenue,
					eventDate: eventContract.eventDate,
					eventDuration: eventContract.eventDuration || null,
					expectedAttendance: eventContract.expectedAttendance || null,
					contractValueVND: eventContract.contractValueVND,
					vatRate: eventContract.vatRate,
					depositPercentage: eventContract.depositPercentage,
					finalPaymentPercentage: eventContract.finalPaymentPercentage,
					professionalIndemnityAmount: eventContract.professionalIndemnityAmount,
					publicLiabilityAmount: eventContract.publicLiabilityAmount,
					planningMeetingDays: eventContract.planningMeetingDays,
					performerBookingDeadline: eventContract.performerBookingDeadline,
					technicalSetupDate: eventContract.technicalSetupDate,
					eventExecutionDate: eventContract.eventExecutionDate,
					setupCommencementTime: eventContract.setupCommencementTime,
					eventExecutionDuration: eventContract.eventExecutionDuration,
					breakdownCompletionDateTime: eventContract.breakdownCompletionDateTime,
					paymentGracePeriodDays: eventContract.paymentGracePeriodDays,
					terminationNoticeDays: eventContract.terminationNoticeDays,
					negotiationPeriodDays: eventContract.negotiationPeriodDays,
					arbitrationLocation: eventContract.arbitrationLocation,
					arbitrationLanguage: eventContract.arbitrationLanguage
				};

				const blob = await generateEventPlanningContract(contractData);
				const filename = `Event_Planning_Contract_${eventContract.clientCompany.replace(/\s+/g, '_')}.docx`;

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
			}
		} catch (error) {
			console.error('Error downloading contract:', error);
			toast.error('Failed to download contract');
		} finally {
			isDownloading = false;
		}
	}

	async function handleDelete() {
		if (!authState.user?.uid) {
			toast.error('You must be logged in to delete contracts');
			return;
		}

		if (!authState.isAdmin) {
			toast.error('Only administrators can delete contracts');
			return;
		}

		if (isDeleting) {
			return;
		}

		if (
			!confirm(
				`Are you sure you want to delete "${contract.eventName}"? This action cannot be undone.`
			)
		) {
			return;
		}

		isDeleting = true;

		try {
			if (contract.type === 'service-provision') {
				await deleteServiceProvisionContract(contract.id);
			} else if (contract.type === 'event-planning') {
				await deleteEventPlanningContract(contract.id);
			} else {
				toast.error('Delete is only available for service-provision and event-planning contracts');
				return;
			}

			if (onDelete) {
				onDelete(contract.id);
			}

			toast.success('Contract deleted successfully');
		} catch (error) {
			console.error('Error deleting contract:', error);
			toast.error('Failed to delete contract');
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

		<!-- Payment Toggle Badge -->
		<div class="col-span-2 flex justify-center">
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
		<div class="col-span-2 flex gap-2 justify-center">
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
			<div class="col-span-1 flex justify-center">
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
			<div class="col-span-1"></div>
		{/if}
	</div>
</div>
