import type { EquipmentRentalOneOffContract } from '$lib/types/v2';
import {
	equipmentRentalOneOffContractInputSchema,
	type EquipmentRentalOneOffContractInput
} from '$lib/schemas/v2/contracts/equipmentRentalOneOff';
import {
	saveEquipmentRentalOneOffContract,
	updateEquipmentRentalOneOffContract
} from '$lib/utils/v2/equipmentRentalOneOffContracts';
import { createOneTimePayment, deletePaymentsByContract } from '$lib/utils/v2/payments';
import { logger } from '$lib/utils/logger';

export interface EquipmentRentalOneOffFormValues {
	contractNumber: string;
	eventId: string | null;
	counterpartyId: string;
	paymentStatus: 'unpaid' | 'paid';
	contractValue: number;
	notes: string;
	quotationReference: string;
	eventName: string;
	eventDate: string;
	setupDateTime: string;
	collectionDateTime: string;
	venueName: string;
	venueNameEnglish: string;
	venueAddress: string;
	venueAddressEnglish: string;
	deposit: number;
	vatRate: number;
	replacementValue: number;
	balancePaymentDays: number;
	latePaymentPenaltyRate: number;
	latePaymentPenaltyCap: number;
	cancellationTier1Days: number;
	cancellationTier1Percent: number;
	cancellationTier2Days: number;
	cancellationTier2Percent: number;
	equipmentList: string;
}

interface SaveEquipmentRentalOneOffFormOptions {
	values: EquipmentRentalOneOffFormValues;
	ownerUid: string;
	counterpartyName: string;
	contract?: EquipmentRentalOneOffContract | null;
}

export function validateEquipmentRentalOneOffForm(
	values: EquipmentRentalOneOffFormValues,
	ownerUid: string | null | undefined
): string | null {
	if (!ownerUid) {
		return 'You must be logged in to create a contract';
	}

	if (!values.counterpartyId) {
		return 'Please select a counterparty';
	}

	if (!values.quotationReference) {
		return 'Please enter a quotation reference';
	}

	if (!values.eventDate) {
		return 'Please set the event date';
	}

	if (!values.setupDateTime || !values.collectionDateTime) {
		return 'Please set setup and collection date/times';
	}

	return null;
}

export function buildEquipmentRentalOneOffContractInput(
	values: EquipmentRentalOneOffFormValues,
	ownerUid: string,
	counterpartyName: string
): EquipmentRentalOneOffContractInput {
	return {
		type: 'equipment-rental-oneoff',
		ownerUid,
		contractNumber: values.contractNumber,
		eventId: values.eventId || null,
		counterpartyId: values.counterpartyId,
		counterpartyName,
		eventName: values.eventName,
		paymentDirection: 'receivable',
		paymentStatus: values.paymentStatus,
		contractValue: values.contractValue,
		currency: 'VND',
		notes: values.notes || null,
		quotationReference: values.quotationReference,
		eventDate: values.eventDate,
		setupDateTime: values.setupDateTime,
		collectionDateTime: values.collectionDateTime,
		venueName: values.venueName,
		venueNameEnglish: values.venueNameEnglish,
		venueAddress: values.venueAddress,
		venueAddressEnglish: values.venueAddressEnglish,
		deposit: values.deposit,
		vatRate: values.vatRate,
		replacementValue: values.replacementValue,
		balancePaymentDays: values.balancePaymentDays,
		latePaymentPenaltyRate: values.latePaymentPenaltyRate,
		latePaymentPenaltyCap: values.latePaymentPenaltyCap,
		cancellationTier1Days: values.cancellationTier1Days,
		cancellationTier1Percent: values.cancellationTier1Percent,
		cancellationTier2Days: values.cancellationTier2Days,
		cancellationTier2Percent: values.cancellationTier2Percent,
		equipmentList: values.equipmentList
	};
}

export async function saveEquipmentRentalOneOffForm({
	values,
	ownerUid,
	counterpartyName,
	contract = null
}: SaveEquipmentRentalOneOffFormOptions): Promise<string> {
	const prerequisiteError = validateEquipmentRentalOneOffForm(values, ownerUid);
	if (prerequisiteError) {
		throw new Error(prerequisiteError);
	}

	const contractData = buildEquipmentRentalOneOffContractInput(values, ownerUid, counterpartyName);
	const validationResult = equipmentRentalOneOffContractInputSchema.safeParse(contractData);
	if (!validationResult.success) {
		throw new Error('Validation error: ' + validationResult.error.issues[0].message);
	}

	let contractId: string;
	if (contract) {
		await updateEquipmentRentalOneOffContract(contract.id, contractData);
		contractId = contract.id;
	} else {
		contractId = await saveEquipmentRentalOneOffContract(contractData);
	}

	try {
		if (contract) {
			await deletePaymentsByContract(contractId);
		}
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
			contractData.eventDate
		);
	} catch (paymentError) {
		logger.error('Error creating payment record:', paymentError);
	}

	return contractId;
}
