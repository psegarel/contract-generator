import type { ServiceProvisionContract } from '$lib/types/v2';
import {
	serviceProvisionContractInputSchema,
	type ServiceProvisionContractInput
} from '$lib/schemas/v2/contracts/serviceProvision';
import {
	saveServiceProvisionContract,
	updateServiceProvisionContract
} from '$lib/utils/v2/serviceProvisionContracts';
import { createOneTimePayment, deletePaymentsByContract } from '$lib/utils/v2/payments';
import { logger } from '$lib/utils/logger';

export interface ServiceProvisionFormValues {
	contractNumber: string;
	eventId: string;
	counterpartyId: string;
	paymentStatus: 'unpaid' | 'paid';
	contractValue: number;
	notes: string;
	jobName: string;
	jobContent: string;
	numberOfPerformances: number;
	firstPerformanceTime: string;
	startDate: string;
	endDate: string;
	taxRate: number;
	status: 'draft' | 'generated';
	bankName: string;
	accountNumber: string;
	clientEmail: string;
	clientAddress: string;
	clientPhone: string;
	clientIdDocument: string;
	clientTaxId: string;
	eventLocation: string;
	paymentDueDate: string;
}

interface SaveServiceProvisionFormOptions {
	values: ServiceProvisionFormValues;
	ownerUid: string | null | undefined;
	eventName: string;
	counterpartyName: string;
	contract?: ServiceProvisionContract | null;
}

export function validateServiceProvisionForm(
	values: ServiceProvisionFormValues,
	ownerUid: string | null | undefined
): string | null {
	if (!ownerUid) return 'You must be logged in to create a contract';
	if (!values.eventId) return 'Please select an event';
	if (!values.counterpartyId) return 'Please select a service provider';
	return null;
}

export function buildServiceProvisionContractInput(
	values: ServiceProvisionFormValues,
	ownerUid: string,
	eventName: string,
	counterpartyName: string
): ServiceProvisionContractInput {
	return {
		type: 'service-provision',
		ownerUid,
		contractNumber: values.contractNumber,
		eventId: values.eventId,
		counterpartyId: values.counterpartyId,
		counterpartyName,
		eventName,
		paymentDirection: 'payable',
		paymentStatus: values.paymentStatus,
		contractValue: values.contractValue,
		currency: 'VND',
		notes: values.notes || null,
		jobName: values.jobName,
		jobContent: values.jobContent,
		numberOfPerformances: values.numberOfPerformances,
		firstPerformanceTime: values.firstPerformanceTime,
		startDate: values.startDate,
		endDate: values.endDate,
		taxRate: values.taxRate,
		netFee: values.contractValue,
		status: values.status,
		bankName: values.bankName,
		accountNumber: values.accountNumber,
		clientEmail: values.clientEmail,
		clientAddress: values.clientAddress,
		clientPhone: values.clientPhone,
		clientIdDocument: values.clientIdDocument,
		clientTaxId: values.clientTaxId || null,
		eventLocation: values.eventLocation,
		paymentDueDate: values.paymentDueDate || values.startDate
	};
}

export async function saveServiceProvisionForm({
	values,
	ownerUid,
	eventName,
	counterpartyName,
	contract = null
}: SaveServiceProvisionFormOptions): Promise<string> {
	const prerequisiteError = validateServiceProvisionForm(values, ownerUid);
	if (prerequisiteError) throw new Error(prerequisiteError);
	if (!ownerUid) throw new Error('You must be logged in to create a contract');

	const contractData = buildServiceProvisionContractInput(
		values,
		ownerUid,
		eventName,
		counterpartyName
	);
	const validationResult = serviceProvisionContractInputSchema.safeParse(contractData);
	if (!validationResult.success) {
		throw new Error('Validation error: ' + validationResult.error.issues[0].message);
	}

	let contractId: string;
	if (contract) {
		await updateServiceProvisionContract(contract.id, contractData);
		contractId = contract.id;
	} else {
		contractId = await saveServiceProvisionContract(contractData);
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
