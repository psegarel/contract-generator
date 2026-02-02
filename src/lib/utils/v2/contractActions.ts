import type { BaseContract } from '$lib/types/v2';
import type { ServiceProvisionContract, EventPlanningContract, EquipmentRentalContract } from '$lib/types/v2/contracts';
import { toast } from 'svelte-sonner';
import { deleteServiceProvisionContract } from './serviceProvisionContracts';
import { deleteEventPlanningContract } from './eventPlanningContracts';
import { deleteEquipmentRentalContract } from './equipmentRentalContracts';
import { deletePaymentsByContract } from './payments';
import { generateServiceContract } from '../serviceContractGenerator';
import { generateEventPlanningContract } from '../eventPlanningContractGenerator';
import { generateEquipmentRentalContract } from '../equipmentRentalContractGenerator';
import { logger } from '../logger';

/**
 * Download a contract as a Word document
 * Supports service-provision, event-planning, and equipment-rental contracts
 */
export async function downloadContract(contract: BaseContract): Promise<void> {
	if (contract.type !== 'service-provision' && contract.type !== 'event-planning' && contract.type !== 'equipment-rental') {
		toast.error('Download is only available for service-provision, event-planning, and equipment-rental contracts');
		return;
	}

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

			await saveFile(blob, filename);
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

			await saveFile(blob, filename);
			toast.success('Contract downloaded successfully!');
		} else if (contract.type === 'equipment-rental') {
			const equipmentRentalContract = contract as EquipmentRentalContract;
			const blob = await generateEquipmentRentalContract(equipmentRentalContract);
			const filename = `Equipment-Rental-Contract-${equipmentRentalContract.contractNumber}.docx`;
			await saveFile(blob, filename);
			toast.success('Contract downloaded successfully!');
		}
	} catch (error) {
		logger.error('Error downloading contract:', error);
		toast.error('Failed to download contract');
		throw error;
	}
}

/**
 * Save a file using File System Access API with fallback to download
 */
async function saveFile(blob: Blob, filename: string): Promise<void> {
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
							'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
						}
					}
				]
			});
			const writable = await handle.createWritable();
			await writable.write(blob);
			await writable.close();
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
}

/**
 * Delete a contract
 * Supports service-provision and event-planning contracts
 * Requires admin privileges (checked by caller)
 */
export async function deleteContract(
	contract: BaseContract,
	options: {
		isAdmin: boolean;
		userUid: string | null;
		onDelete?: (contractId: string) => void;
	}
): Promise<void> {
	if (!options.userUid) {
		toast.error('You must be logged in to delete contracts');
		return;
	}

	if (!options.isAdmin) {
		toast.error('Only administrators can delete contracts');
		return;
	}

	if (contract.type !== 'service-provision' && contract.type !== 'event-planning' && contract.type !== 'equipment-rental') {
		toast.error('Delete is only available for service-provision, event-planning, and equipment-rental contracts');
		return;
	}

	const contractName = contract.eventName || contract.contractNumber;
	if (
		!confirm(
			`Are you sure you want to delete "${contractName}"? This action cannot be undone.`
		)
	) {
		return;
	}

	try {
		if (contract.type === 'service-provision') {
			await deleteServiceProvisionContract(contract.id);
		} else if (contract.type === 'event-planning') {
			await deleteEventPlanningContract(contract.id);
		} else if (contract.type === 'equipment-rental') {
			await deleteEquipmentRentalContract(contract.id);
		}

		// Clean up associated payment records
		await deletePaymentsByContract(contract.id);

		if (options.onDelete) {
			options.onDelete(contract.id);
		}

		toast.success('Contract deleted successfully');
	} catch (error) {
		logger.error('Error deleting contract:', error);
		toast.error('Failed to delete contract');
		throw error;
	}
}
