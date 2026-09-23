import type { EventPlanningContract } from '$lib/types/v2';
import {
	eventPlanningContractInputSchema,
	type EventPlanningContractInput
} from '$lib/schemas/v2/contracts/eventPlanning';
import {
	saveEventPlanningContract,
	updateEventPlanningContract
} from '$lib/utils/v2/eventPlanningContracts';
import { createOneTimePayment, deletePaymentsByContract } from '$lib/utils/v2/payments';
import { logger } from '$lib/utils/logger';

export interface EventPlanningFormValues {
	contractNumber: string;
	eventId: string;
	counterpartyId: string;
	paymentStatus: 'unpaid' | 'paid';
	contractValueVND: number;
	notes: string;
	contractDate: string;
	contractLocation: string;
	clientCompany: string;
	clientAddress: string;
	clientTaxCode: string;
	clientRepresentativeName: string;
	clientRepresentativePosition: string;
	eventTheme: string;
	eventType: string;
	eventDescription: string;
	eventVenue: string;
	eventDate: string;
	eventDuration: string;
	expectedAttendance: string;
	vatRate: number;
	depositPercentage: number;
	finalPaymentPercentage: number;
	professionalIndemnityAmount: number;
	publicLiabilityAmount: number;
	planningMeetingDays: number;
	performerBookingDeadline: string;
	technicalSetupDate: string;
	eventExecutionDate: string;
	setupCommencementTime: string;
	eventExecutionDuration: string;
	breakdownCompletionDateTime: string;
	paymentGracePeriodDays: number;
	terminationNoticeDays: number;
	negotiationPeriodDays: number;
	arbitrationLocation: string;
	arbitrationLanguage: string;
	paymentDueDate: string;
}

interface SaveEventPlanningFormOptions {
	values: EventPlanningFormValues;
	ownerUid: string | null | undefined;
	eventName: string;
	counterpartyName: string;
	contract?: EventPlanningContract | null;
}

export function validateEventPlanningForm(
	values: EventPlanningFormValues,
	ownerUid: string | null | undefined
): string | null {
	if (!ownerUid) return 'You must be logged in to create a contract';
	if (!values.eventId) return 'Please select an event';
	if (!values.counterpartyId) return 'Please select a client';
	return null;
}

export function buildEventPlanningContractInput(
	values: EventPlanningFormValues,
	ownerUid: string,
	eventName: string,
	counterpartyName: string
): EventPlanningContractInput {
	return {
		type: 'event-planning',
		ownerUid,
		contractNumber: values.contractNumber,
		eventId: values.eventId,
		counterpartyId: values.counterpartyId,
		counterpartyName,
		eventName,
		paymentDirection: 'receivable',
		paymentStatus: values.paymentStatus,
		contractValue: values.contractValueVND,
		currency: 'VND',
		notes: values.notes || null,
		contractDate: values.contractDate,
		contractLocation: values.contractLocation,
		clientCompany: values.clientCompany,
		clientAddress: values.clientAddress,
		clientTaxCode: values.clientTaxCode,
		clientRepresentativeName: values.clientRepresentativeName,
		clientRepresentativePosition: values.clientRepresentativePosition,
		eventTheme: values.eventTheme || null,
		eventType: values.eventType || null,
		eventDescription: values.eventDescription || null,
		eventVenue: values.eventVenue,
		eventDate: values.eventDate,
		eventDuration: values.eventDuration || null,
		expectedAttendance: values.expectedAttendance || null,
		contractValueVND: values.contractValueVND,
		vatRate: values.vatRate,
		depositPercentage: values.depositPercentage,
		finalPaymentPercentage: values.finalPaymentPercentage,
		professionalIndemnityAmount: values.professionalIndemnityAmount,
		publicLiabilityAmount: values.publicLiabilityAmount,
		planningMeetingDays: values.planningMeetingDays,
		performerBookingDeadline: values.performerBookingDeadline,
		technicalSetupDate: values.technicalSetupDate,
		eventExecutionDate: values.eventExecutionDate,
		setupCommencementTime: values.setupCommencementTime,
		eventExecutionDuration: values.eventExecutionDuration,
		breakdownCompletionDateTime: values.breakdownCompletionDateTime,
		paymentGracePeriodDays: values.paymentGracePeriodDays,
		terminationNoticeDays: values.terminationNoticeDays,
		negotiationPeriodDays: values.negotiationPeriodDays,
		arbitrationLocation: values.arbitrationLocation,
		arbitrationLanguage: values.arbitrationLanguage,
		paymentDueDate: values.paymentDueDate || values.eventDate
	};
}

export async function saveEventPlanningForm({
	values,
	ownerUid,
	eventName,
	counterpartyName,
	contract = null
}: SaveEventPlanningFormOptions): Promise<string> {
	const prerequisiteError = validateEventPlanningForm(values, ownerUid);
	if (prerequisiteError) throw new Error(prerequisiteError);
	if (!ownerUid) throw new Error('You must be logged in to create a contract');

	const contractData = buildEventPlanningContractInput(
		values,
		ownerUid,
		eventName,
		counterpartyName
	);
	const validationResult = eventPlanningContractInputSchema.safeParse(contractData);
	if (!validationResult.success) {
		throw new Error('Validation error: ' + validationResult.error.issues[0].message);
	}

	let contractId: string;
	if (contract) {
		await updateEventPlanningContract(contract.id, contractData);
		contractId = contract.id;
	} else {
		contractId = await saveEventPlanningContract(contractData);
	}

	try {
		if (contract) await deletePaymentsByContract(contractId);
		await createOneTimePayment(
			{
				id: contractId,
				type: contractData.type,
				contractNumber: contractData.contractNumber,
				counterpartyName: contractData.counterpartyName,
				paymentDirection: contractData.paymentDirection,
				paymentStatus: contractData.paymentStatus,
				contractValue: contractData.contractValue,
				currency: contractData.currency,
				ownerUid: contractData.ownerUid
			},
			contractData.paymentDueDate
		);
	} catch (paymentError) {
		logger.error('Error creating payment record:', paymentError);
	}

	return contractId;
}
