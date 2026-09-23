import { Timestamp } from 'firebase/firestore';
import type { ClientCounterparty } from '$lib/types/v2';
import { clientCounterpartySchema, type ClientCounterpartyInput } from '$lib/schemas/v2';
import { saveCounterparty, updateCounterparty } from '$lib/utils/v2/counterparties';

export interface ClientFormValues {
	name: string;
	email: string;
	phone: string;
	address: string;
	clientType: 'individual' | 'company';
	companyName: string;
	representativeName: string;
	representativePosition: string;
	idDocument: string;
	taxId: string;
	bankName: string;
	bankAccountNumber: string;
	notes: string;
}

interface SaveClientFormOptions {
	values: ClientFormValues;
	ownerUid: string | null | undefined;
	client?: ClientCounterparty | null;
}

export function buildClientInput(
	values: ClientFormValues,
	ownerUid: string,
	createdAt = Timestamp.now()
): ClientCounterpartyInput {
	return {
		type: 'client',
		ownerUid,
		name: values.name,
		email: values.email || null,
		phone: values.phone || null,
		address: values.address || null,
		clientType: values.clientType,
		companyName: values.companyName || null,
		representativeName: values.representativeName || null,
		representativePosition: values.representativePosition || null,
		idDocument: values.idDocument || null,
		taxId: values.taxId || null,
		bankName: values.bankName || null,
		bankAccountNumber: values.bankAccountNumber || null,
		notes: values.notes || null,
		createdAt,
		updatedAt: Timestamp.now()
	};
}

export async function saveClientForm({
	values,
	ownerUid,
	client
}: SaveClientFormOptions): Promise<string> {
	if (!ownerUid) {
		throw new Error('You must be logged in to create a client');
	}

	const clientData = buildClientInput(values, ownerUid, client?.createdAt || Timestamp.now());
	const validationResult = clientCounterpartySchema.safeParse(clientData);
	if (!validationResult.success) {
		throw new Error('Validation error: ' + validationResult.error.issues[0].message);
	}

	if (client) {
		await updateCounterparty(client.id, clientData);
		return client.id;
	}

	return saveCounterparty(clientData);
}
