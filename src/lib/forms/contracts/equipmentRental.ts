import type { EquipmentItem, EquipmentRentalContract } from '$lib/types/v2';
import {
	equipmentRentalContractInputSchema,
	type EquipmentRentalContractInput
} from '$lib/schemas/v2/contracts/equipmentRental';
import {
	saveEquipmentRentalContract,
	updateEquipmentRentalContract
} from '$lib/utils/v2/equipmentRentalContracts';
import { createRecurringPayments, deletePaymentsByContract } from '$lib/utils/v2/payments';
import { logger } from '$lib/utils/logger';

export interface EquipmentRentalFormValues {
	contractNumber: string;
	counterpartyId: string;
	paymentStatus: 'unpaid' | 'paid';
	contractValue: number;
	notes: string;
	rentalStartDate: string;
	rentalEndDate: string;
	equipment: EquipmentItem[];
	monthlyRent: number;
	securityDeposit: number;
	damageWaiver: boolean;
	deliveryFee: number;
	venueName: string;
	venueNameEnglish: string;
	venueAddress: string;
	venueAddressEnglish: string;
}

interface SaveEquipmentRentalFormOptions {
	values: EquipmentRentalFormValues;
	ownerUid: string | null | undefined;
	counterpartyName: string;
	contract?: EquipmentRentalContract | null;
}

export function validateEquipmentRentalForm(
	values: EquipmentRentalFormValues,
	ownerUid: string | null | undefined
): string | null {
	if (!ownerUid) return 'You must be logged in to create a contract';
	if (!values.counterpartyId) return 'Please select a counterparty';
	if (values.equipment.length === 0) return 'Please add at least one equipment item';

	for (let index = 0; index < values.equipment.length; index += 1) {
		const item = values.equipment[index];
		if (!item.name || item.quantity <= 0 || item.unitPrice < 0) {
			return `Equipment item #${index + 1} is incomplete. Please fill in all required fields.`;
		}
	}

	return null;
}

export function buildEquipmentRentalContractInput(
	values: EquipmentRentalFormValues,
	ownerUid: string,
	counterpartyName: string
): EquipmentRentalContractInput {
	return {
		type: 'equipment-rental',
		ownerUid,
		contractNumber: values.contractNumber,
		eventId: null,
		counterpartyId: values.counterpartyId,
		counterpartyName,
		eventName: null,
		paymentDirection: 'receivable',
		paymentStatus: values.paymentStatus,
		contractValue: values.contractValue,
		currency: 'VND',
		notes: values.notes || '',
		rentalStartDate: values.rentalStartDate,
		rentalEndDate: values.rentalEndDate,
		equipment: values.equipment,
		monthlyRent: values.monthlyRent,
		securityDeposit: values.securityDeposit,
		damageWaiver: values.damageWaiver,
		deliveryFee: values.deliveryFee,
		venueName: values.venueName,
		venueNameEnglish: values.venueNameEnglish,
		venueAddress: values.venueAddress,
		venueAddressEnglish: values.venueAddressEnglish
	};
}

function buildInstallments(values: EquipmentRentalFormValues) {
	const startDate = new Date(values.rentalStartDate);
	const endDate = new Date(values.rentalEndDate);
	const installments: { label: string; dueDate: Date; amount: number }[] = [];
	const current = new Date(startDate);

	while (current <= endDate) {
		installments.push({
			label: current.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
			dueDate: new Date(current),
			amount: values.monthlyRent
		});
		current.setMonth(current.getMonth() + 1);
	}

	return installments;
}

export async function saveEquipmentRentalForm({
	values,
	ownerUid,
	counterpartyName,
	contract = null
}: SaveEquipmentRentalFormOptions): Promise<string> {
	const prerequisiteError = validateEquipmentRentalForm(values, ownerUid);
	if (prerequisiteError) throw new Error(prerequisiteError);
	if (!ownerUid) throw new Error('You must be logged in to create a contract');

	const contractData = buildEquipmentRentalContractInput(values, ownerUid, counterpartyName);
	const validationResult = equipmentRentalContractInputSchema.safeParse(contractData);
	if (!validationResult.success) {
		throw new Error('Validation error: ' + validationResult.error.issues[0].message);
	}

	let contractId: string;
	if (contract) {
		await updateEquipmentRentalContract(contract.id, contractData);
		contractId = contract.id;
	} else {
		contractId = await saveEquipmentRentalContract(contractData);
	}

	try {
		if (contract) await deletePaymentsByContract(contractId);
		const installments = buildInstallments(values);
		if (installments.length > 0) {
			await createRecurringPayments(
				{
					id: contractId,
					type: contractData.type,
					contractNumber: contractData.contractNumber,
					counterpartyName: contractData.counterpartyName,
					paymentDirection: contractData.paymentDirection,
					paymentStatus: contractData.paymentStatus,
					contractValue: contractData.contractValue,
					currency: contractData.currency,
					ownerUid: contractData.ownerUid,
					rentalStartDate: contractData.rentalStartDate,
					rentalEndDate: contractData.rentalEndDate,
					monthlyRent: contractData.monthlyRent
				},
				installments
			);
		}
	} catch (paymentError) {
		logger.error('Error creating payment records:', paymentError);
	}

	return contractId;
}
