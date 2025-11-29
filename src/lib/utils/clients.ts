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
	phone: string;
	address: string;
	taxId: string | null;
	bankName: string;
	accountNumber: string;
};

const clientSchema = z.object({
	ownerUid: z.string().min(1),
	name: z.string().min(1),
	phone: z.string().min(1),
	address: z.string().min(1),
	taxId: z.string().nullable().optional(),
	bankName: z.string().min(1),
	accountNumber: z.string().min(1),
	createdAt: z.unknown().optional(), // Firestore Timestamp
	updatedAt: z.unknown().optional()  // Firestore Timestamp
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
		phone: parsed.data.phone,
		address: parsed.data.address,
		taxId: parsed.data.taxId ?? null,
		bankName: parsed.data.bankName,
		accountNumber: parsed.data.accountNumber
	};
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
	const toWrite = {
		ownerUid,
		...data,
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
