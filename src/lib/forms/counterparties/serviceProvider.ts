import { Timestamp } from 'firebase/firestore';
import type { CounterpartyDocuments, ServiceProviderContractor } from '$lib/types/v2';
import {
	serviceProviderContractorSchema,
	type ServiceProviderContractorInput
} from '$lib/schemas/v2';
import { saveCounterparty, updateCounterparty } from '$lib/utils/v2/counterparties';

export type ServiceProviderDocumentNumber = 1 | 2 | 3 | 4 | 5;

export interface ServiceProviderFormValues {
	name: string;
	email: string;
	phone: string;
	address: string;
	serviceType: string;
	companyName: string;
	typicalDeliverables: string[];
	equipmentProvided: string[];
	businessLicense: string;
	insuranceInfo: string;
	taxId: string;
	bankName: string;
	bankAccountNumber: string;
	idDocument: string;
	notes: string;
	documents: CounterpartyDocuments;
}

export interface InlineServiceProviderFormValues {
	name: string;
	serviceType: string;
	email: string;
	phone: string;
}

interface SaveServiceProviderFormOptions {
	values: ServiceProviderFormValues;
	ownerUid: string | null | undefined;
	serviceProvider?: ServiceProviderContractor | null;
}

export function buildServiceProviderInput(
	values: ServiceProviderFormValues,
	ownerUid: string,
	createdAt = Timestamp.now()
): ServiceProviderContractorInput {
	return {
		type: 'contractor',
		contractorType: 'service-provider',
		ownerUid,
		name: values.name,
		email: values.email || null,
		phone: values.phone || null,
		address: values.address || null,
		serviceType: values.serviceType,
		companyName: values.companyName || null,
		typicalDeliverables: values.typicalDeliverables,
		equipmentProvided: values.equipmentProvided,
		businessLicense: values.businessLicense || null,
		insuranceInfo: values.insuranceInfo || null,
		taxId: values.taxId || null,
		bankName: values.bankName || null,
		bankAccountNumber: values.bankAccountNumber || null,
		idDocument: values.idDocument || null,
		notes: values.notes || null,
		documents: Object.keys(values.documents).length > 0 ? values.documents : undefined,
		createdAt,
		updatedAt: Timestamp.now()
	};
}

export async function saveServiceProviderForm({
	values,
	ownerUid,
	serviceProvider
}: SaveServiceProviderFormOptions): Promise<string> {
	if (!ownerUid) {
		throw new Error('You must be logged in to create a service provider');
	}

	const serviceProviderData = buildServiceProviderInput(
		values,
		ownerUid,
		serviceProvider?.createdAt || Timestamp.now()
	);
	const validationResult = serviceProviderContractorSchema.safeParse(serviceProviderData);
	if (!validationResult.success) {
		throw new Error('Validation error: ' + validationResult.error.issues[0].message);
	}

	if (serviceProvider) {
		await updateCounterparty(serviceProvider.id, serviceProviderData);
		return serviceProvider.id;
	}

	return saveCounterparty(serviceProviderData);
}

export function toInlineServiceProviderFormValues(
	values: InlineServiceProviderFormValues
): ServiceProviderFormValues {
	return {
		name: values.name,
		email: values.email,
		phone: values.phone,
		address: '',
		serviceType: values.serviceType,
		companyName: '',
		typicalDeliverables: [],
		equipmentProvided: [],
		businessLicense: '',
		insuranceInfo: '',
		taxId: '',
		bankName: '',
		bankAccountNumber: '',
		idDocument: '',
		notes: '',
		documents: {}
	};
}

export function createInlineServiceProvider(
	values: InlineServiceProviderFormValues,
	ownerUid: string | null | undefined
): Promise<string> {
	return saveServiceProviderForm({
		values: toInlineServiceProviderFormValues(values),
		ownerUid
	});
}
