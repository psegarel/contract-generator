import {
	arrayRemove,
	arrayUnion,
	collection,
	addDoc,
	deleteDoc,
	doc,
	getDoc,
	getDocs,
	orderBy,
	query,
	serverTimestamp,
	updateDoc,
	where
} from 'firebase/firestore';
import { db } from '$lib/config/firebase';
import { getCurrentUser } from '../auth';
import type { Lead, LeadInput } from '$lib/types/v2';
import { leadInputSchema } from '$lib/schemas/v2';
import { normalizeEmail } from './quotationCalculations';
import { logger } from '../logger';

const COLLECTION_NAME = 'leads';

function requireCurrentUserUid(): string {
	const uid = getCurrentUser()?.uid;
	if (!uid) throw new Error('You must be signed in to manage leads');
	return uid;
}

export async function saveLead(leadData: LeadInput): Promise<string> {
	const ownerUid = requireCurrentUserUid();
	const validationResult = leadInputSchema.safeParse(leadData);
	if (!validationResult.success) {
		logger.error('Lead validation error:', validationResult.error);
		throw new Error('Invalid lead data: ' + validationResult.error.message);
	}

	const data = validationResult.data;
	const existing = await findLeadByEmail(data.email);
	if (existing) {
		await updateLead(existing.id, {
			name: data.name,
			companyName: data.companyName ?? null,
			phone: data.phone ?? null,
			address: data.address ?? null,
			source: existing.source,
			status: existing.status,
			email: existing.email
		});
		return existing.id;
	}

	const docRef = await addDoc(collection(db, COLLECTION_NAME), {
		...data,
		email: normalizeEmail(data.email),
		companyName: data.companyName ?? null,
		phone: data.phone ?? null,
		address: data.address ?? null,
		ownerUid,
		quotationIds: [],
		createdAt: serverTimestamp(),
		updatedAt: serverTimestamp()
	});

	return docRef.id;
}

export async function getLeadById(leadId: string): Promise<Lead | null> {
	const snapshot = await getDoc(doc(db, COLLECTION_NAME, leadId));
	if (!snapshot.exists()) return null;
	return { id: snapshot.id, ...snapshot.data() } as Lead;
}

export async function findLeadByEmail(email: string): Promise<Lead | null> {
	const ownerUid = requireCurrentUserUid();
	const snapshots = await getDocs(
		query(
			collection(db, COLLECTION_NAME),
			where('ownerUid', '==', ownerUid),
			where('email', '==', normalizeEmail(email))
		)
	);
	const first = snapshots.docs[0];
	return first ? ({ id: first.id, ...first.data() } as Lead) : null;
}

export async function getLeads(): Promise<Lead[]> {
	const snapshots = await getDocs(
		query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'))
	);
	return snapshots.docs.map((snapshot) => ({ id: snapshot.id, ...snapshot.data() }) as Lead);
}

export async function updateLead(leadId: string, updates: Partial<LeadInput>): Promise<void> {
	const data = { ...updates };
	if (data.email) data.email = normalizeEmail(data.email);

	await updateDoc(doc(db, COLLECTION_NAME, leadId), {
		...data,
		updatedAt: serverTimestamp()
	});
}

export async function addQuotationToLead(leadId: string, quotationId: string): Promise<void> {
	await updateDoc(doc(db, COLLECTION_NAME, leadId), {
		quotationIds: arrayUnion(quotationId),
		updatedAt: serverTimestamp()
	});
}

export async function removeQuotationFromLead(leadId: string, quotationId: string): Promise<void> {
	await updateDoc(doc(db, COLLECTION_NAME, leadId), {
		quotationIds: arrayRemove(quotationId),
		updatedAt: serverTimestamp()
	});
}

export async function deleteLead(leadId: string): Promise<void> {
	await deleteDoc(doc(db, COLLECTION_NAME, leadId));
}
