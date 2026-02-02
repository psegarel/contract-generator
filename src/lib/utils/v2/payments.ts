import {
	collection,
	addDoc,
	getDocs,
	doc,
	updateDoc,
	query,
	where,
	orderBy,
	serverTimestamp,
	onSnapshot,
	deleteDoc,
	writeBatch,
	type Unsubscribe
} from 'firebase/firestore';
import { db } from '$lib/config/firebase';
import type { Payment } from '$lib/types/v2/payment';
import type { BaseContract } from '$lib/types/v2';
import { paymentInputSchema, type PaymentInput } from '$lib/schemas/v2/payment';
import { logger } from '../logger';

const COLLECTION_NAME = 'payments';

/**
 * Subscribe to all payments (real-time updates)
 */
export function subscribeToPayments(
	callback: (payments: Payment[]) => void,
	onError: (error: Error) => void
): Unsubscribe {
	const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));

	return onSnapshot(
		q,
		(snapshot) => {
			const payments = snapshot.docs.map((d) => ({
				id: d.id,
				...d.data()
			})) as Payment[];
			callback(payments);
		},
		(error) => {
			logger.error('Error in payments subscription:', error);
			onError(error);
		}
	);
}

/**
 * Create a single payment record
 */
export async function createPayment(data: PaymentInput): Promise<string> {
	const validationResult = paymentInputSchema.safeParse(data);
	if (!validationResult.success) {
		logger.error('Payment validation error:', validationResult.error);
		throw new Error('Invalid payment data: ' + validationResult.error.message);
	}

	const toWrite = {
		...validationResult.data,
		paidAt: null,
		paidBy: null,
		createdAt: serverTimestamp(),
		updatedAt: serverTimestamp()
	};

	const docRef = await addDoc(collection(db, COLLECTION_NAME), toWrite);
	return docRef.id;
}

/**
 * Create recurring (monthly) payment records for an equipment rental contract
 */
export async function createRecurringPayments(
	contract: BaseContract & { rentalStartDate: string; rentalEndDate: string; monthlyRent: number },
	installments: { label: string; dueDate: Date; amount: number }[]
): Promise<string[]> {
	const ids: string[] = [];
	for (const installment of installments) {
		const id = await createPayment({
			contractId: contract.id,
			contractType: contract.type,
			contractNumber: contract.contractNumber,
			counterpartyName: contract.counterpartyName,
			paymentType: 'recurring',
			amount: installment.amount,
			currency: 'VND',
			direction: contract.paymentDirection,
			status: 'pending',
			label: installment.label,
			dueDate: null,
			ownerUid: contract.ownerUid,
			notes: null
		});
		ids.push(id);
	}
	return ids;
}

/**
 * Create a one-time payment record for a contract
 */
export async function createOneTimePayment(contract: BaseContract): Promise<string> {
	return createPayment({
		contractId: contract.id,
		contractType: contract.type,
		contractNumber: contract.contractNumber,
		counterpartyName: contract.counterpartyName,
		paymentType: 'one-time',
		amount: contract.contractValue,
		currency: 'VND',
		direction: contract.paymentDirection,
		status: contract.paymentStatus === 'paid' ? 'paid' : 'pending',
		label: null,
		dueDate: null,
		ownerUid: contract.ownerUid,
		notes: null
	});
}

/**
 * Update payment record status (mark as paid/pending)
 */
export async function updatePaymentStatus(
	paymentId: string,
	status: 'pending' | 'paid',
	adminUid: string
): Promise<void> {
	const docRef = doc(db, COLLECTION_NAME, paymentId);
	await updateDoc(docRef, {
		status,
		paidAt: status === 'paid' ? serverTimestamp() : null,
		paidBy: status === 'paid' ? adminUid : null,
		updatedAt: serverTimestamp()
	});
}

/**
 * Delete a single payment record
 */
export async function deletePayment(paymentId: string): Promise<void> {
	await deleteDoc(doc(db, COLLECTION_NAME, paymentId));
}

/**
 * Delete all payment records for a contract
 */
export async function deletePaymentsByContract(contractId: string): Promise<void> {
	const q = query(collection(db, COLLECTION_NAME), where('contractId', '==', contractId));
	const snapshot = await getDocs(q);

	if (snapshot.empty) return;

	const batch = writeBatch(db);
	snapshot.docs.forEach((d) => {
		batch.delete(d.ref);
	});
	await batch.commit();
}

/**
 * Get all payment records for a contract
 */
export async function getPaymentsByContract(contractId: string): Promise<Payment[]> {
	const q = query(
		collection(db, COLLECTION_NAME),
		where('contractId', '==', contractId),
		orderBy('createdAt', 'asc')
	);
	const snapshot = await getDocs(q);
	return snapshot.docs.map((d) => ({
		id: d.id,
		...d.data()
	})) as Payment[];
}

/**
 * Sync payment records when contract payment status is toggled.
 * If no payment records exist for a one-time contract, creates one automatically.
 * Updates all payment records for the contract to the new status.
 */
export async function syncContractPaymentStatus(
	contract: BaseContract,
	newStatus: 'paid' | 'unpaid',
	adminUid: string
): Promise<void> {
	const payments = await getPaymentsByContract(contract.id);

	if (payments.length === 0) {
		// Auto-create a one-time payment record
		await createOneTimePayment({
			...contract,
			paymentStatus: newStatus === 'paid' ? 'paid' : 'unpaid'
		});
		return;
	}

	// Update all existing payment records
	const paymentStatus = newStatus === 'paid' ? 'paid' : 'pending';
	for (const payment of payments) {
		await updatePaymentStatus(payment.id, paymentStatus, adminUid);
	}
}
