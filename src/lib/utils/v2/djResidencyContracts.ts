import {
	collection,
	addDoc,
	getDocs,
	getDoc,
	doc,
	updateDoc,
	query,
	where,
	orderBy,
	serverTimestamp,
	onSnapshot,
	deleteDoc,
	type Unsubscribe
} from 'firebase/firestore';
import { db } from '$lib/config/firebase';
import type { DjResidencyContract, PerformanceLog, MonthlyInvoice } from '$lib/types/v2';
import {
	djResidencyContractInputSchema,
	performanceLogInputSchema,
	monthlyInvoiceInputSchema,
	type DjResidencyContractInput,
	type PerformanceLogInput,
	type MonthlyInvoiceInput
} from '$lib/schemas/v2';
import { logger } from '../logger';

const COLLECTION_NAME = 'dj-residency-contracts';
const PERFORMANCES_SUBCOLLECTION = 'performances';
const INVOICES_SUBCOLLECTION = 'invoices';

// ==========================================
// DJ Residency Contract CRUD
// ==========================================

/**
 * Subscribe to DJ residency contracts (real-time updates)
 */
export function subscribeToDjResidencyContracts(
	callback: (contracts: DjResidencyContract[]) => void,
	onError: (error: Error) => void
): Unsubscribe {
	const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));

	return onSnapshot(
		q,
		(snapshot) => {
			const contracts = snapshot.docs.map((d) => ({
				id: d.id,
				...d.data()
			})) as DjResidencyContract[];
			callback(contracts);
		},
		(error) => {
			logger.error('Error in DJ residency contracts subscription:', error);
			onError(error);
		}
	);
}

/**
 * Save a new DJ residency contract
 */
export async function saveDjResidencyContract(
	contractData: DjResidencyContractInput
): Promise<string> {
	try {
		const validationResult = djResidencyContractInputSchema.safeParse(contractData);
		if (!validationResult.success) {
			logger.error('Validation error:', validationResult.error);
			throw new Error('Invalid contract data: ' + validationResult.error.message);
		}

		const toWrite = {
			...validationResult.data,
			eventId: contractData.eventId ?? null,
			eventName: contractData.eventName ?? null,
			notes: contractData.notes ?? null,
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp()
		};

		const docRef = await addDoc(collection(db, COLLECTION_NAME), toWrite);
		return docRef.id;
	} catch (error) {
		logger.error('Error saving DJ residency contract:', error);
		throw new Error('Failed to save DJ residency contract');
	}
}

/**
 * Get DJ residency contract by ID
 */
export async function getDjResidencyContractById(
	contractId: string
): Promise<DjResidencyContract | null> {
	try {
		const docRef = doc(db, COLLECTION_NAME, contractId);
		const docSnap = await getDoc(docRef);

		if (!docSnap.exists()) {
			return null;
		}

		return {
			id: docSnap.id,
			...docSnap.data()
		} as DjResidencyContract;
	} catch (error) {
		logger.error('Error fetching DJ residency contract:', error);
		throw new Error('Failed to fetch DJ residency contract');
	}
}

/**
 * Get all DJ residency contracts
 */
export async function getDjResidencyContracts(): Promise<DjResidencyContract[]> {
	try {
		const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
		const querySnapshot = await getDocs(q);

		return querySnapshot.docs.map((d) => ({
			id: d.id,
			...d.data()
		})) as DjResidencyContract[];
	} catch (error) {
		logger.error('Error fetching DJ residency contracts:', error);
		throw new Error('Failed to fetch DJ residency contracts');
	}
}

/**
 * Get DJ residency contracts by counterparty (venue) ID
 */
export async function getDjResidencyContractsByCounterpartyId(
	counterpartyId: string
): Promise<DjResidencyContract[]> {
	try {
		const q = query(
			collection(db, COLLECTION_NAME),
			where('counterpartyId', '==', counterpartyId),
			orderBy('createdAt', 'desc')
		);

		const querySnapshot = await getDocs(q);
		return querySnapshot.docs.map((d) => ({
			id: d.id,
			...d.data()
		})) as DjResidencyContract[];
	} catch (error) {
		logger.error('Error fetching DJ residency contracts by counterparty:', error);
		throw new Error('Failed to fetch DJ residency contracts');
	}
}

/**
 * Update DJ residency contract
 */
export async function updateDjResidencyContract(
	contractId: string,
	updates: Partial<DjResidencyContractInput>
): Promise<void> {
	try {
		const docRef = doc(db, COLLECTION_NAME, contractId);

		const docSnap = await getDoc(docRef);
		if (!docSnap.exists()) {
			throw new Error('DJ residency contract not found');
		}

		const toUpdate = {
			...updates,
			updatedAt: serverTimestamp()
		};

		await updateDoc(docRef, toUpdate);
	} catch (error) {
		logger.error('Error updating DJ residency contract:', error);
		throw new Error('Failed to update DJ residency contract');
	}
}

/**
 * Update residency status
 */
export async function updateDjResidencyStatus(
	contractId: string,
	status: 'active' | 'completed' | 'terminated'
): Promise<void> {
	try {
		const docRef = doc(db, COLLECTION_NAME, contractId);

		await updateDoc(docRef, {
			residencyStatus: status,
			updatedAt: serverTimestamp()
		});
	} catch (error) {
		logger.error('Error updating residency status:', error);
		throw new Error('Failed to update residency status');
	}
}

/**
 * Update payment status for a DJ residency contract
 */
export async function updateDjResidencyContractPaymentStatus(
	contractId: string,
	status: 'unpaid' | 'paid',
	adminUid: string
): Promise<void> {
	try {
		const docRef = doc(db, COLLECTION_NAME, contractId);

		const docSnap = await getDoc(docRef);
		if (!docSnap.exists()) {
			throw new Error('DJ residency contract not found');
		}

		await updateDoc(docRef, {
			paymentStatus: status,
			paidAt: status === 'paid' ? serverTimestamp() : null,
			paidBy: status === 'paid' ? adminUid : null,
			updatedAt: serverTimestamp()
		});
	} catch (error) {
		logger.error('Error updating payment status:', error);
		throw new Error('Failed to update payment status');
	}
}

/**
 * Delete DJ residency contract and all subcollections
 */
export async function deleteDjResidencyContract(contractId: string): Promise<void> {
	try {
		// Delete all performances in subcollection
		const performancesRef = collection(db, COLLECTION_NAME, contractId, PERFORMANCES_SUBCOLLECTION);
		const performancesSnap = await getDocs(performancesRef);
		for (const perfDoc of performancesSnap.docs) {
			await deleteDoc(perfDoc.ref);
		}

		// Delete all invoices in subcollection
		const invoicesRef = collection(db, COLLECTION_NAME, contractId, INVOICES_SUBCOLLECTION);
		const invoicesSnap = await getDocs(invoicesRef);
		for (const invDoc of invoicesSnap.docs) {
			await deleteDoc(invDoc.ref);
		}

		// Delete the contract document
		const docRef = doc(db, COLLECTION_NAME, contractId);
		await deleteDoc(docRef);
	} catch (error) {
		logger.error('Error deleting DJ residency contract:', error);
		throw new Error('Failed to delete DJ residency contract');
	}
}

// ==========================================
// Performance Log Subcollection
// ==========================================

/**
 * Subscribe to performances for a contract (real-time updates)
 */
export function subscribeToPerformances(
	contractId: string,
	callback: (performances: PerformanceLog[]) => void,
	onError: (error: Error) => void
): Unsubscribe {
	const q = query(
		collection(db, COLLECTION_NAME, contractId, PERFORMANCES_SUBCOLLECTION),
		orderBy('date', 'desc')
	);

	return onSnapshot(
		q,
		(snapshot) => {
			const performances = snapshot.docs.map((d) => ({
				id: d.id,
				...d.data()
			})) as PerformanceLog[];
			callback(performances);
		},
		(error) => {
			logger.error('Error in performances subscription:', error);
			onError(error);
		}
	);
}

/**
 * Add a performance log entry
 */
export async function addPerformance(
	contractId: string,
	performanceData: PerformanceLogInput
): Promise<string> {
	try {
		const validationResult = performanceLogInputSchema.safeParse(performanceData);
		if (!validationResult.success) {
			logger.error('Performance validation error:', validationResult.error);
			throw new Error('Invalid performance data: ' + validationResult.error.message);
		}

		const toWrite = {
			...validationResult.data,
			notes: performanceData.notes ?? null,
			invoiceMonth: performanceData.invoiceMonth ?? null,
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp()
		};

		const performancesRef = collection(db, COLLECTION_NAME, contractId, PERFORMANCES_SUBCOLLECTION);
		const docRef = await addDoc(performancesRef, toWrite);
		return docRef.id;
	} catch (error) {
		logger.error('Error adding performance:', error);
		throw new Error('Failed to add performance');
	}
}

/**
 * Get all performances for a contract
 */
export async function getPerformances(contractId: string): Promise<PerformanceLog[]> {
	try {
		const q = query(
			collection(db, COLLECTION_NAME, contractId, PERFORMANCES_SUBCOLLECTION),
			orderBy('date', 'desc')
		);
		const querySnapshot = await getDocs(q);

		return querySnapshot.docs.map((d) => ({
			id: d.id,
			...d.data()
		})) as PerformanceLog[];
	} catch (error) {
		logger.error('Error fetching performances:', error);
		throw new Error('Failed to fetch performances');
	}
}

/**
 * Get uninvoiced performances for a contract
 */
export async function getUninvoicedPerformances(contractId: string): Promise<PerformanceLog[]> {
	try {
		const q = query(
			collection(db, COLLECTION_NAME, contractId, PERFORMANCES_SUBCOLLECTION),
			where('invoiced', '==', false),
			orderBy('date', 'asc')
		);
		const querySnapshot = await getDocs(q);

		return querySnapshot.docs.map((d) => ({
			id: d.id,
			...d.data()
		})) as PerformanceLog[];
	} catch (error) {
		logger.error('Error fetching uninvoiced performances:', error);
		throw new Error('Failed to fetch uninvoiced performances');
	}
}

/**
 * Mark performances as invoiced
 */
export async function markPerformancesAsInvoiced(
	contractId: string,
	performanceIds: string[],
	invoiceMonth: string
): Promise<void> {
	try {
		for (const performanceId of performanceIds) {
			const docRef = doc(
				db,
				COLLECTION_NAME,
				contractId,
				PERFORMANCES_SUBCOLLECTION,
				performanceId
			);
			await updateDoc(docRef, {
				invoiced: true,
				invoiceMonth,
				updatedAt: serverTimestamp()
			});
		}
	} catch (error) {
		logger.error('Error marking performances as invoiced:', error);
		throw new Error('Failed to mark performances as invoiced');
	}
}

/**
 * Update a performance log entry
 */
export async function updatePerformance(
	contractId: string,
	performanceId: string,
	updates: Partial<PerformanceLogInput>
): Promise<void> {
	try {
		const docRef = doc(
			db,
			COLLECTION_NAME,
			contractId,
			PERFORMANCES_SUBCOLLECTION,
			performanceId
		);

		await updateDoc(docRef, {
			...updates,
			updatedAt: serverTimestamp()
		});
	} catch (error) {
		logger.error('Error updating performance:', error);
		throw new Error('Failed to update performance');
	}
}

/**
 * Delete a performance log entry
 */
export async function deletePerformance(contractId: string, performanceId: string): Promise<void> {
	try {
		const docRef = doc(
			db,
			COLLECTION_NAME,
			contractId,
			PERFORMANCES_SUBCOLLECTION,
			performanceId
		);
		await deleteDoc(docRef);
	} catch (error) {
		logger.error('Error deleting performance:', error);
		throw new Error('Failed to delete performance');
	}
}

// ==========================================
// Monthly Invoice Subcollection
// ==========================================

/**
 * Subscribe to invoices for a contract (real-time updates)
 */
export function subscribeToInvoices(
	contractId: string,
	callback: (invoices: MonthlyInvoice[]) => void,
	onError: (error: Error) => void
): Unsubscribe {
	const q = query(
		collection(db, COLLECTION_NAME, contractId, INVOICES_SUBCOLLECTION),
		orderBy('month', 'desc')
	);

	return onSnapshot(
		q,
		(snapshot) => {
			const invoices = snapshot.docs.map((d) => ({
				id: d.id,
				...d.data()
			})) as MonthlyInvoice[];
			callback(invoices);
		},
		(error) => {
			logger.error('Error in invoices subscription:', error);
			onError(error);
		}
	);
}

/**
 * Add a monthly invoice record
 */
export async function addMonthlyInvoice(
	contractId: string,
	invoiceData: MonthlyInvoiceInput
): Promise<string> {
	try {
		const validationResult = monthlyInvoiceInputSchema.safeParse(invoiceData);
		if (!validationResult.success) {
			logger.error('Invoice validation error:', validationResult.error);
			throw new Error('Invalid invoice data: ' + validationResult.error.message);
		}

		const toWrite = {
			...validationResult.data,
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp()
		};

		const invoicesRef = collection(db, COLLECTION_NAME, contractId, INVOICES_SUBCOLLECTION);
		const docRef = await addDoc(invoicesRef, toWrite);
		return docRef.id;
	} catch (error) {
		logger.error('Error adding monthly invoice:', error);
		throw new Error('Failed to add monthly invoice');
	}
}

/**
 * Get all invoices for a contract
 */
export async function getInvoices(contractId: string): Promise<MonthlyInvoice[]> {
	try {
		const q = query(
			collection(db, COLLECTION_NAME, contractId, INVOICES_SUBCOLLECTION),
			orderBy('month', 'desc')
		);
		const querySnapshot = await getDocs(q);

		return querySnapshot.docs.map((d) => ({
			id: d.id,
			...d.data()
		})) as MonthlyInvoice[];
	} catch (error) {
		logger.error('Error fetching invoices:', error);
		throw new Error('Failed to fetch invoices');
	}
}

/**
 * Update invoice status
 */
export async function updateInvoiceStatus(
	contractId: string,
	invoiceId: string,
	status: 'draft' | 'issued' | 'paid'
): Promise<void> {
	try {
		const docRef = doc(db, COLLECTION_NAME, contractId, INVOICES_SUBCOLLECTION, invoiceId);

		await updateDoc(docRef, {
			status,
			updatedAt: serverTimestamp()
		});
	} catch (error) {
		logger.error('Error updating invoice status:', error);
		throw new Error('Failed to update invoice status');
	}
}

/**
 * Add service contract IDs to an invoice
 */
export async function addServiceContractToInvoice(
	contractId: string,
	invoiceId: string,
	serviceContractId: string
): Promise<void> {
	try {
		const docRef = doc(db, COLLECTION_NAME, contractId, INVOICES_SUBCOLLECTION, invoiceId);
		const docSnap = await getDoc(docRef);

		if (!docSnap.exists()) {
			throw new Error('Invoice not found');
		}

		const currentIds = docSnap.data().serviceContractIds || [];
		await updateDoc(docRef, {
			serviceContractIds: [...currentIds, serviceContractId],
			updatedAt: serverTimestamp()
		});
	} catch (error) {
		logger.error('Error adding service contract to invoice:', error);
		throw new Error('Failed to add service contract to invoice');
	}
}

/**
 * Delete a monthly invoice
 */
export async function deleteInvoice(contractId: string, invoiceId: string): Promise<void> {
	try {
		const docRef = doc(db, COLLECTION_NAME, contractId, INVOICES_SUBCOLLECTION, invoiceId);
		await deleteDoc(docRef);
	} catch (error) {
		logger.error('Error deleting invoice:', error);
		throw new Error('Failed to delete invoice');
	}
}
