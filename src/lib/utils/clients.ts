import { ClientRepository } from './ClientRepository';

/**
 * Document metadata for uploaded images
 */
export type DocumentMetadata = {
	url: string;
	fileName: string;
	uploadedAt: Date;
	uploadedBy: string;
	size: number;
};

/**
 * Client profile data stored in Firestore
 */
export type ClientData = {
	name: string;
	email: string;
	phone: string;
	address: string;
	idDocument: string; // Passport Number (foreigners) or ID Card Number (Vietnamese)
	taxId: string | null;
	bankName: string | null;
	accountNumber: string | null;
	documents?: {
		image1?: DocumentMetadata;
		image2?: DocumentMetadata;
	};
};

// Singleton instance for backward compatibility
const repository = new ClientRepository();

// Legacy function exports - delegate to repository
export async function listClients(): Promise<Array<{ id: string; name: string; email: string }>> {
	return repository.list();
}

export async function getClient(id: string): Promise<(ClientData & { id: string }) | null> {
	return repository.getById(id);
}

export async function upsertClient(
	ownerUid: string,
	data: ClientData,
	id?: string
): Promise<string> {
	return repository.upsert(ownerUid, data, id);
}

export async function deleteClient(id: string): Promise<boolean> {
	return repository.delete(id);
}

// Re-export repository class for those who want to use it directly
export { ClientRepository };
