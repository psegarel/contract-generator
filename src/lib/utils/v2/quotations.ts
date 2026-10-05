import {
	arrayRemove,
	arrayUnion,
	collection,
	deleteDoc,
	doc,
	getDoc,
	getDocs,
	onSnapshot,
	orderBy,
	query,
	runTransaction,
	serverTimestamp,
	Timestamp,
	updateDoc,
	where,
	writeBatch,
	type Unsubscribe
} from 'firebase/firestore';
import { db } from '$lib/config/firebase';
import { getCurrentUser } from '../auth';
import type { Quotation, QuotationInput, QuotationStatus } from '$lib/types/v2';
import { quotationInputSchema } from '$lib/schemas/v2';
import { calculateQuotationTotals, calculateQuotationVat } from './quotationCalculations';
import { logger } from '../logger';

const COLLECTION_NAME = 'quotations';
const SEQUENCE_COLLECTION = 'sequences';
const SEQUENCE_DOCUMENT = 'quotations';

function requireCurrentUserUid(): string {
	const uid = getCurrentUser()?.uid;
	if (!uid) throw new Error('You must be signed in to manage quotations');
	return uid;
}

async function nextQuotationNumber(): Promise<string> {
	const year = new Date().getFullYear();
	const sequenceRef = doc(db, SEQUENCE_COLLECTION, SEQUENCE_DOCUMENT);

	return runTransaction(db, async (transaction) => {
		const snapshot = await transaction.get(sequenceRef);
		const currentYear = snapshot.exists() ? Number(snapshot.data().year) : year;
		const currentValue =
			snapshot.exists() && currentYear === year ? Number(snapshot.data().value) : 0;
		const nextValue = currentValue + 1;

		transaction.set(sequenceRef, { year, value: nextValue, updatedAt: serverTimestamp() });
		return `QT-${year}-${String(nextValue).padStart(4, '0')}`;
	});
}

function createQuotationWriteData(
	input: QuotationInput,
	ownerUid: string,
	quotationNumber: string,
	revision: number,
	rootQuotationId: string,
	revisionOfId: string | null
) {
	const validationResult = quotationInputSchema.safeParse(input);
	if (!validationResult.success) {
		logger.error('Quotation validation error:', validationResult.error);
		throw new Error('Invalid quotation data: ' + validationResult.error.message);
	}

	const data = validationResult.data;
	const totals = calculateQuotationTotals(
		data.lineItems,
		data.equipmentDiscountPercent,
		data.transportVnd,
		data.handlingVnd
	);
	const vatAmountVnd = calculateQuotationVat(totals.totalVnd, data.vatRatePercent);

	return {
		quotationNumber,
		revision,
		rootQuotationId,
		revisionOfId,
		...(revisionOfId === null ? { latestRevisionId: rootQuotationId, latestRevision: 1 } : {}),
		status: data.status,
		ownerUid,
		customer: {
			...data.customer,
			clientId: data.customer.clientId ?? null,
			leadId: data.customer.leadId ?? null,
			companyName: data.customer.companyName ?? null,
			email: data.customer.email ?? null,
			phone: data.customer.phone ?? null,
			address: data.customer.address ?? null
		},
		lineItems: data.lineItems.map((item) => ({
			...item,
			manufacturer: item.manufacturer ?? null,
			imageUrl: item.imageUrl ?? null,
			note: item.note ?? null
		})),
		equipmentSubtotalVnd: totals.equipmentSubtotalVnd,
		equipmentDiscountPercent: data.equipmentDiscountPercent,
		equipmentDiscountVnd: totals.equipmentDiscountVnd,
		transportVnd: data.transportVnd,
		handlingVnd: data.handlingVnd,
		vatRatePercent: data.vatRatePercent,
		vatAmountVnd,
		totalVnd: totals.totalVnd + vatAmountVnd,
		validUntil: data.validUntil,
		eventName: data.eventName ?? null,
		eventDate: data.eventDate ?? null,
		venue: data.venue ?? null,
		notes: data.notes ?? null,
		createdAt: serverTimestamp(),
		updatedAt: serverTimestamp(),
		sentAt: null,
		acceptedAt: null,
		declinedAt: null,
		expiredAt: null
	};
}

export async function saveQuotation(input: QuotationInput): Promise<string> {
	const ownerUid = requireCurrentUserUid();
	const quotationNumber = await nextQuotationNumber();
	const quotationRef = doc(collection(db, COLLECTION_NAME));
	const data = createQuotationWriteData(input, ownerUid, quotationNumber, 1, quotationRef.id, null);
	const batch = writeBatch(db);
	batch.set(quotationRef, data);
	if (data.customer.leadId) {
		batch.update(doc(db, 'leads', data.customer.leadId), {
			quotationIds: arrayUnion(quotationRef.id),
			updatedAt: serverTimestamp()
		});
	}
	await batch.commit();

	return quotationRef.id;
}

export async function getQuotationById(quotationId: string): Promise<Quotation | null> {
	const snapshot = await getDoc(doc(db, COLLECTION_NAME, quotationId));
	if (!snapshot.exists()) return null;
	return { id: snapshot.id, ...snapshot.data() } as Quotation;
}

export async function getQuotationRevisionHistory(quotation: Quotation): Promise<Quotation[]> {
	const snapshots = await getDocs(
		query(
			collection(db, COLLECTION_NAME),
			where('quotationNumber', '==', quotation.quotationNumber)
		)
	);
	return snapshots.docs
		.map((snapshot) => ({ id: snapshot.id, ...snapshot.data() }) as Quotation)
		.sort((a, b) => a.revision - b.revision);
}

export async function getQuotations(): Promise<Quotation[]> {
	const snapshots = await getDocs(
		query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'))
	);
	return snapshots.docs.map((snapshot) => ({ id: snapshot.id, ...snapshot.data() }) as Quotation);
}

export function subscribeToQuotations(
	callback: (quotations: Quotation[]) => void,
	onError: (error: Error) => void
): Unsubscribe {
	const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
	return onSnapshot(
		q,
		(snapshot) => {
			callback(
				snapshot.docs.map((snapshot) => ({ id: snapshot.id, ...snapshot.data() }) as Quotation)
			);
		},
		onError
	);
}

export async function updateQuotation(quotationId: string, input: QuotationInput): Promise<void> {
	const existing = await getQuotationById(quotationId);
	if (!existing) throw new Error('Quotation not found');
	if (existing.status !== 'draft') throw new Error('Only draft quotations can be edited');

	const ownerUid = requireCurrentUserUid();
	const data = createQuotationWriteData(
		{ ...input, status: 'draft' },
		ownerUid,
		existing.quotationNumber,
		existing.revision,
		existing.rootQuotationId ?? existing.id,
		existing.revisionOfId ?? null
	);
	const batch = writeBatch(db);
	batch.update(doc(db, COLLECTION_NAME, quotationId), data);
	if (existing.customer.leadId !== data.customer.leadId) {
		if (existing.customer.leadId) {
			batch.update(doc(db, 'leads', existing.customer.leadId), {
				quotationIds: arrayRemove(quotationId),
				updatedAt: serverTimestamp()
			});
		}
		if (data.customer.leadId) {
			batch.update(doc(db, 'leads', data.customer.leadId), {
				quotationIds: arrayUnion(quotationId),
				updatedAt: serverTimestamp()
			});
		}
	}
	await batch.commit();
}

export async function createQuotationRevision(quotationId: string): Promise<string> {
	const ownerUid = requireCurrentUserUid();
	const sourceRef = doc(db, COLLECTION_NAME, quotationId);
	const newRevisionRef = doc(collection(db, COLLECTION_NAME));
	const newRevisionId = await runTransaction(db, async (transaction) => {
		const sourceSnapshot = await transaction.get(sourceRef);
		if (!sourceSnapshot.exists()) throw new Error('Quotation not found');
		const source = { id: sourceSnapshot.id, ...sourceSnapshot.data() } as Quotation;
		if (source.status !== 'sent') throw new Error('Only sent quotations can be revised');
		if (source.ownerUid !== ownerUid) throw new Error('You can only revise your own quotations');

		const rootQuotationId = source.rootQuotationId ?? source.id;
		const rootRef = doc(db, COLLECTION_NAME, rootQuotationId);
		const rootSnapshot = await transaction.get(rootRef);
		if (!rootSnapshot.exists()) throw new Error('Quotation history root not found');
		const latestRevisionId = rootSnapshot.data().latestRevisionId ?? rootQuotationId;
		const latestRevision = Number(rootSnapshot.data().latestRevision ?? 1);
		if (source.id !== latestRevisionId || source.revision !== latestRevision) {
			throw new Error('A newer revision already exists for this quotation');
		}

		const input: QuotationInput = {
			status: 'draft',
			customer: source.customer,
			lineItems: source.lineItems,
			equipmentDiscountPercent: source.equipmentDiscountPercent,
			transportVnd: source.transportVnd,
			handlingVnd: source.handlingVnd,
			vatRatePercent: source.vatRatePercent,
			validUntil: source.validUntil,
			eventName: source.eventName,
			eventDate: source.eventDate,
			venue: source.venue,
			notes: source.notes
		};
		const data = createQuotationWriteData(
			input,
			ownerUid,
			source.quotationNumber,
			latestRevision + 1,
			rootQuotationId,
			source.id
		);
		if (sourceRef.id === rootRef.id) {
			transaction.update(sourceRef, {
				status: 'superseded',
				latestRevisionId: newRevisionRef.id,
				latestRevision: latestRevision + 1,
				updatedAt: serverTimestamp()
			});
		} else {
			transaction.update(sourceRef, { status: 'superseded', updatedAt: serverTimestamp() });
			transaction.update(rootRef, {
				latestRevisionId: newRevisionRef.id,
				latestRevision: latestRevision + 1,
				updatedAt: serverTimestamp()
			});
		}
		transaction.set(newRevisionRef, data);
		if (source.customer.leadId) {
			transaction.update(doc(db, 'leads', source.customer.leadId), {
				quotationIds: arrayUnion(newRevisionRef.id),
				updatedAt: serverTimestamp()
			});
		}
		return newRevisionRef.id;
	});
	return newRevisionId;
}

export async function updateQuotationStatus(
	quotationId: string,
	status: Extract<QuotationStatus, 'sent' | 'accepted' | 'declined' | 'expired'>
): Promise<void> {
	const existing = await getQuotationById(quotationId);
	if (!existing) throw new Error('Quotation not found');

	const allowedTransitions: Record<QuotationStatus, QuotationStatus[]> = {
		draft: ['sent', 'expired'],
		sent: ['accepted', 'declined', 'expired'],
		accepted: [],
		declined: [],
		expired: [],
		superseded: []
	};
	if (!allowedTransitions[existing.status].includes(status)) {
		throw new Error(`Cannot change quotation status from ${existing.status} to ${status}`);
	}

	const timestampField = {
		sent: 'sentAt',
		accepted: 'acceptedAt',
		declined: 'declinedAt',
		expired: 'expiredAt'
	}[status];

	await updateDoc(doc(db, COLLECTION_NAME, quotationId), {
		status,
		[timestampField]: Timestamp.now(),
		updatedAt: serverTimestamp()
	});
}

export async function deleteQuotation(quotationId: string): Promise<void> {
	const existing = await getQuotationById(quotationId);
	if (!existing) throw new Error('Quotation not found');
	if (existing.status !== 'draft') throw new Error('Only draft quotations can be deleted');
	await deleteDoc(doc(db, COLLECTION_NAME, quotationId));
}
