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
	serverTimestamp
} from 'firebase/firestore';
import { z } from 'zod';

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
};

const clientSchema = z.object({
	ownerUid: z.string().min(1),
	name: z.string().min(1),
	email: z.string().email(),
	phone: z.string().min(1),
	address: z.string().min(1),
	idDocument: z.string().min(1), // Passport or ID Card Number
	taxId: z.string().nullable().optional(),
	bankName: z.string().nullable().optional(),
	accountNumber: z.string().nullable().optional(),
	createdAt: z.unknown().optional(), // Firestore Timestamp
	updatedAt: z.unknown().optional() // Firestore Timestamp
});

/**
 * List minimal client summaries for selection
 * Returns clients owned by `ownerUid` with id and name
 */
export async function listClients(ownerUid: string): Promise<Array<{ id: string; name: string }>> {
	const q = query(collection(db, 'clients'), where('ownerUid', '==', ownerUid));
	const snap = await getDocs(q);
	return snap.docs.map((d) => ({ id: d.id, name: (d.data().name as string) || '' }));
}

/**
 * Get a full client profile by id for the given owner
 * Returns null if not found or owner mismatch
 */
export async function getClient(
	ownerUid: string,
	id: string
): Promise<(ClientData & { id: string }) | null> {
	const ref = doc(db, 'clients', id);
	const snap = await getDoc(ref);
	if (!snap.exists()) return null;
	const data = snap.data();
	if (data.ownerUid !== ownerUid) return null;
	const parsed = clientSchema.safeParse({ ...data });
	if (!parsed.success) {
		console.warn('Invalid client data shape, skipping:', parsed.error?.message);
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
		accountNumber: parsed.data.accountNumber ?? null
	};
}

/**
 * Check for duplicate email or ID document
 * Returns error message if duplicate found, null otherwise
 */
async function checkDuplicates(
	ownerUid: string,
	email: string,
	idDocument: string,
	excludeId?: string
): Promise<string | null> {
	// Check for duplicate email
	const emailQuery = query(
		collection(db, 'clients'),
		where('ownerUid', '==', ownerUid),
		where('email', '==', email.trim().toLowerCase())
	);
	const emailSnap = await getDocs(emailQuery);
	const duplicateEmail = emailSnap.docs.find((doc) => doc.id !== excludeId);
	if (duplicateEmail) {
		return `A client with email "${email}" already exists.`;
	}

	// Check for duplicate ID document
	const idQuery = query(
		collection(db, 'clients'),
		where('ownerUid', '==', ownerUid),
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
 * Create or update a client profile
 * If `id` is provided, updates that doc; otherwise creates a new doc
 * Returns the client document id
 */
export async function upsertClient(
	ownerUid: string,
	data: ClientData,
	id?: string
): Promise<string> {
	// Normalize email and ID document for consistency
	const normalizedData = {
		...data,
		email: data.email.trim().toLowerCase(),
		idDocument: data.idDocument.trim().toUpperCase()
	};

	// Check for duplicates
	const duplicateError = await checkDuplicates(
		ownerUid,
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
	// runtime validation before write
	const parsed = clientSchema.safeParse(toWrite);
	if (!parsed.success) {
		throw new Error(`Invalid client payload: ${parsed.error?.message}`);
	}
	if (id) {
		const ref = doc(db, 'clients', id);
		await setDoc(ref, parsed.data, { merge: true });
		return id;
	}
	const ref = await addDoc(collection(db, 'clients'), {
		...parsed.data,
		createdAt: serverTimestamp()
	});
	return ref.id;
}

/**
 * Delete a client profile
 * Only deletes if the client belongs to the specified owner
 */
export async function deleteClient(ownerUid: string, id: string): Promise<boolean> {
	// Verify ownership before deleting
	const client = await getClient(ownerUid, id);
	if (!client) {
		return false;
	}
	const ref = doc(db, 'clients', id);
	await deleteDoc(ref);
	return true;
}
