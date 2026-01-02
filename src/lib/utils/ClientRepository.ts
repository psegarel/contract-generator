import { db } from '$lib/config/firebase';
import {
	collection,
	addDoc,
	setDoc,
	doc,
	getDoc,
	getDocs,
	deleteDoc,
	query,
	where,
	serverTimestamp,
	type Timestamp
} from 'firebase/firestore';
import { z } from 'zod';
import { ClientDocumentManager } from './clientDocuments';
import type { ClientData, DocumentMetadata } from './clients';

const documentMetadataSchema = z.object({
	url: z.string(),
	fileName: z.string(),
	uploadedAt: z.unknown(), // Firestore Timestamp or Date
	uploadedBy: z.string(),
	size: z.number()
});

const clientSchema = z.object({
	ownerUid: z.string().min(1),
	name: z.string().min(1),
	email: z.string().email(),
	phone: z.string().min(1),
	address: z.string().min(1),
	idDocument: z.string().min(1),
	taxId: z.string().nullable().optional(),
	bankName: z.string().nullable().optional(),
	accountNumber: z.string().nullable().optional(),
	documents: z
		.object({
			image1: documentMetadataSchema.optional(),
			image2: documentMetadataSchema.optional()
		})
		.optional(),
	createdAt: z.unknown().optional(),
	updatedAt: z.unknown().optional()
});

/**
 * Repository for managing client data in Firestore
 */
export class ClientRepository {
	private static readonly COLLECTION_NAME = 'clients';

	/**
	 * List all clients (minimal data for selection)
	 */
	async list(): Promise<Array<{ id: string; name: string; email: string }>> {
		const snap = await getDocs(collection(db, ClientRepository.COLLECTION_NAME));
		return snap.docs.map((d) => ({
			id: d.id,
			name: (d.data().name as string) || '',
			email: (d.data().email as string) || ''
		}));
	}

	/**
	 * Get a full client profile by ID
	 */
	async getById(id: string): Promise<(ClientData & { id: string }) | null> {
		const ref = doc(db, ClientRepository.COLLECTION_NAME, id);
		const snap = await getDoc(ref);

		if (!snap.exists()) return null;

		const data = snap.data();
		const parsed = clientSchema.safeParse({ ...data });

		if (!parsed.success) {
			console.warn('Invalid client data shape:', parsed.error?.message);
			return null;
		}

		return {
			id: snap.id,
			name: parsed.data.name,
			email: parsed.data.email,
			phone: parsed.data.phone,
			address: parsed.data.address,
			idDocument: parsed.data.idDocument,
			taxId: parsed.data.taxId ?? null,
			bankName: parsed.data.bankName ?? null,
			accountNumber: parsed.data.accountNumber ?? null,
			documents: this.convertTimestamps(parsed.data.documents)
		};
	}

	/**
	 * Convert Firestore Timestamps to Dates for document metadata
	 */
	private convertTimestamps(documents?: {
		image1?: any;
		image2?: any;
	}): { image1?: DocumentMetadata; image2?: DocumentMetadata } | undefined {
		if (!documents) return undefined;

		return {
			image1: documents.image1
				? {
						...documents.image1,
						uploadedAt: this.toDate(documents.image1.uploadedAt)
					}
				: undefined,
			image2: documents.image2
				? {
						...documents.image2,
						uploadedAt: this.toDate(documents.image2.uploadedAt)
					}
				: undefined
		};
	}

	/**
	 * Convert Firestore Timestamp to Date
	 */
	private toDate(timestamp: unknown): Date {
		if (timestamp instanceof Date) return timestamp;
		if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
			return (timestamp as Timestamp).toDate();
		}
		return new Date();
	}

	/**
	 * Check for duplicate email or ID document
	 */
	private async checkDuplicates(
		email: string,
		idDocument: string,
		excludeId?: string
	): Promise<string | null> {
		// Check for duplicate email
		const emailQuery = query(
			collection(db, ClientRepository.COLLECTION_NAME),
			where('email', '==', email.trim().toLowerCase())
		);
		const emailSnap = await getDocs(emailQuery);
		const duplicateEmail = emailSnap.docs.find((doc) => doc.id !== excludeId);

		if (duplicateEmail) {
			return `A client with email "${email}" already exists.`;
		}

		// Check for duplicate ID document
		const idQuery = query(
			collection(db, ClientRepository.COLLECTION_NAME),
			where('idDocument', '==', idDocument.trim().toUpperCase())
		);
		const idSnap = await getDocs(idQuery);
		const duplicateId = idSnap.docs.find((doc) => doc.id !== excludeId);

		if (duplicateId) {
			return `A client with ID/Passport number "${idDocument}" already exists.`;
		}

		return null;
	}

	/**
	 * Normalize client data
	 */
	private normalizeData(data: ClientData): ClientData {
		return {
			...data,
			email: data.email.trim().toLowerCase(),
			idDocument: data.idDocument.trim().toUpperCase()
		};
	}

	/**
	 * Create or update a client
	 */
	async upsert(ownerUid: string, data: ClientData, id?: string): Promise<string> {
		const normalizedData = this.normalizeData(data);

		// Check for duplicates
		const duplicateError = await this.checkDuplicates(
			normalizedData.email,
			normalizedData.idDocument,
			id
		);

		if (duplicateError) {
			throw new Error(duplicateError);
		}

		const toWrite = {
			ownerUid,
			...normalizedData,
			updatedAt: serverTimestamp()
		};

		// Validate before write
		const parsed = clientSchema.safeParse(toWrite);
		if (!parsed.success) {
			throw new Error(`Invalid client payload: ${parsed.error?.message}`);
		}

		if (id) {
			// Update existing
			const ref = doc(db, ClientRepository.COLLECTION_NAME, id);
			await setDoc(ref, parsed.data, { merge: true });
			return id;
		}

		// Create new
		const ref = await addDoc(collection(db, ClientRepository.COLLECTION_NAME), {
			...parsed.data,
			createdAt: serverTimestamp()
		});
		return ref.id;
	}

	/**
	 * Delete a client and all associated documents
	 */
	async delete(id: string): Promise<boolean> {
		// Verify client exists
		const client = await this.getById(id);
		if (!client) {
			return false;
		}

		// Delete associated documents from storage
		try {
			const docManager = new ClientDocumentManager(id);
			await docManager.deleteAllDocuments();
		} catch (error) {
			console.warn('Error deleting client documents:', error);
			// Continue with client deletion even if document deletion fails
		}

		// Delete client document
		const ref = doc(db, ClientRepository.COLLECTION_NAME, id);
		await deleteDoc(ref);
		return true;
	}
}
