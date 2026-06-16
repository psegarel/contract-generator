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
	writeBatch,
	Timestamp,
	type Unsubscribe
} from 'firebase/firestore';
import { db } from '$lib/config/firebase';
import type { DjResidencyContract, PerformanceLog, PerformerContractor } from '$lib/types/v2';
import type { ClientCounterparty } from '$lib/types/v2';
import { createPayment, getPaymentsByContract, deletePayment, deletePaymentsByContract } from './payments';
import { getCounterpartyById } from './counterparties';
import {
	saveServiceProvisionContract,
	getServiceProvisionContractsByEventId,
	deleteServiceProvisionContract
} from './serviceProvisionContracts';
import {
	djResidencyContractInputSchema,
	performanceLogInputSchema,
	type DjResidencyContractInput,
	type PerformanceLogInput
} from '$lib/schemas/v2';
import { formatMonthLabel } from '$lib/utils/formatting';
import { logger } from '../logger';

const COLLECTION_NAME = 'dj-residency-contracts';
const PERFORMANCES_SUBCOLLECTION = 'performances';

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
 * Mark performances as invoiced (locks the month)
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
// Monthly Contract Generation
// ==========================================

/**
 * Generate (or regenerate) service provision contracts and payment records for a month.
 *
 * Idempotent: deletes any previously generated contracts for the month before creating new ones,
 * so it is safe to call multiple times (e.g. after correcting performance logs).
 *
 * For a given month:
 * - Groups the provided performances by performer
 * - Validates each performer has required payment fields (email, phone, bank, ID)
 * - Creates one service provision contract per performer
 * - Creates one payable payment record per service contract (we owe performers)
 * - Creates one receivable payment record on the DJ residency contract (venue owes us)
 * - Performances are NOT locked — they remain editable for future corrections
 *
 * @param contractId - The DJ residency contract ID
 * @param month - Month string "YYYY-MM"
 * @param contract - The DJ residency contract
 * @param venueCounterparty - The venue/client counterparty
 * @param ownerUid - UID of the user performing the action
 * @param uninvoicedMonthPerformances - Performances for this month
 * @returns Count of service contracts created and total month amount
 */
export async function generateMonthlyContracts(
	contractId: string,
	month: string,
	contract: DjResidencyContract,
	venueCounterparty: ClientCounterparty,
	ownerUid: string,
	uninvoicedMonthPerformances: PerformanceLog[]
): Promise<{ serviceContractCount: number; totalAmount: number }> {
	if (uninvoicedMonthPerformances.length === 0) {
		throw new Error('No performances for this month');
	}

	// Upsert: delete any previously generated contracts for this month before recreating
	const eventId = `djr-${contractId}-${month}`;
	const existingServiceContracts = await getServiceProvisionContractsByEventId(eventId);
	for (const sc of existingServiceContracts) {
		await deletePaymentsByContract(sc.id);
		await deleteServiceProvisionContract(sc.id);
	}
	const existingPayments = await getPaymentsByContract(contractId);
	const existingMonthPayment = existingPayments.find(
		(p) => p.label === formatMonthLabel(month) && p.direction === 'receivable'
	);
	if (existingMonthPayment) {
		await deletePayment(existingMonthPayment.id);
	}

	// Group performances by performer
	const byPerformer: Record<string, { performerName: string; performances: PerformanceLog[] }> = {};
	for (const perf of uninvoicedMonthPerformances) {
		if (!byPerformer[perf.performerId]) {
			byPerformer[perf.performerId] = { performerName: perf.performerName, performances: [] };
		}
		byPerformer[perf.performerId].performances.push(perf);
	}

	// Fetch and validate all performer counterparties before writing anything
	const performerDataMap = new Map<string, PerformerContractor>();
	for (const [performerId, data] of Object.entries(byPerformer)) {
		const counterparty = await getCounterpartyById(performerId);
		if (!counterparty || counterparty.type !== 'contractor') {
			throw new Error(`Performer "${data.performerName}" not found in counterparties`);
		}
		const performer = counterparty as PerformerContractor;
		const missing: string[] = [];
		if (!performer.email) missing.push('email');
		if (!performer.phone) missing.push('phone');
		if (!performer.bankName) missing.push('bank name');
		if (!performer.bankAccountNumber) missing.push('bank account number');
		if (!performer.idDocument) missing.push('ID document');
		if (missing.length > 0) {
			throw new Error(
				`Cannot generate contracts — ${performer.name} is missing: ${missing.join(', ')}`
			);
		}
		performerDataMap.set(performerId, performer);
	}

	// Client billing for the month: hours worked × hourly rate
	const totalMonthAmount = uninvoicedMonthPerformances.reduce(
		(sum, p) => sum + p.hoursWorked * contract.performanceFeeVND,
		0
	);
	const dueDate = new Date();
	dueDate.setDate(dueDate.getDate() + 14);
	const paymentDueDateStr = dueDate.toISOString().split('T')[0];
	const paymentDueTimestamp = Timestamp.fromDate(dueDate);
	const monthLabel = formatMonthLabel(month);

	// Create service provision contracts and payable payment records for each performer
	for (const [performerId, perfData] of Object.entries(byPerformer)) {
		const performer = performerDataMap.get(performerId)!;
		const totalSets = perfData.performances.reduce((sum, p) => sum + p.setsCompleted, 0);
		// Use the per-log performer pay locked at logging time — not the client rate
		const totalAmount = perfData.performances.reduce((sum, p) => sum + p.performerPayVND, 0);

		const dates = perfData.performances.map((p) => p.date).sort();
		const startDate = dates[0];
		const endDate = dates[dates.length - 1];
		const serviceContractNumber = `${contract.contractNumber}-${month}-${performerId.slice(-4)}`;

		const serviceContractId = await saveServiceProvisionContract({
			type: 'service-provision',
			ownerUid,
			contractNumber: serviceContractNumber,
			eventId: `djr-${contractId}-${month}`,
			counterpartyId: performerId,
			counterpartyName: performer.name,
			eventName: `DJ Residency ${monthLabel}`,
			paymentDirection: 'payable',
			paymentStatus: 'unpaid',
			contractValue: totalAmount,
			currency: 'VND',
			notes: `Generated from DJ Residency contract ${contract.contractNumber}`,
			jobName: 'DJ Performance',
			jobContent: `${totalSets} DJ sets at ${venueCounterparty.companyName || venueCounterparty.name}`,
			numberOfPerformances: totalSets,
			firstPerformanceTime: '20:00',
			startDate,
			endDate,
			taxRate: performer.pitRate ?? 10,
			netFee: totalAmount,
			status: 'generated',
			bankName: performer.bankName!,
			accountNumber: performer.bankAccountNumber!,
			clientEmail: performer.email!,
			clientAddress: performer.address || venueCounterparty.address || '',
			clientPhone: performer.phone!,
			clientIdDocument: performer.idDocument!,
			clientTaxId: performer.taxId || null,
			eventLocation: venueCounterparty.address || '',
			paymentDueDate: paymentDueDateStr
		});

		// Payable payment record: we owe the performer
		await createPayment({
			contractId: serviceContractId,
			contractType: 'service-provision',
			contractNumber: serviceContractNumber,
			counterpartyName: performer.name,
			paymentType: 'one-time',
			amount: totalAmount,
			currency: 'VND',
			direction: 'payable',
			status: 'pending',
			label: null,
			dueDate: paymentDueTimestamp,
			ownerUid,
			notes: null
		});
	}

	// Receivable payment record: venue owes us for the month
	await createPayment({
		contractId,
		contractType: 'dj-residency',
		contractNumber: contract.contractNumber,
		counterpartyName: contract.counterpartyName,
		paymentType: 'one-time',
		amount: totalMonthAmount,
		currency: 'VND',
		direction: 'receivable',
		status: 'pending',
		label: monthLabel,
		dueDate: paymentDueTimestamp,
		ownerUid,
		notes: null
	});

	return {
		serviceContractCount: Object.keys(byPerformer).length,
		totalAmount: totalMonthAmount
	};
}

/**
 * Unlock a previously invoiced month.
 *
 * Reverses generateMonthlyContracts():
 * - Deletes service provision contracts generated for this month (and their payment records)
 * - Deletes the receivable payment record on the DJ residency contract for this month
 * - Resets all performances for the month back to uninvoiced
 */
export async function unlockMonth(contractId: string, month: string): Promise<void> {
	// 1. Find and delete service provision contracts created for this month
	const eventId = `djr-${contractId}-${month}`;
	const serviceContracts = await getServiceProvisionContractsByEventId(eventId);
	for (const sc of serviceContracts) {
		await deletePaymentsByContract(sc.id);
		await deleteServiceProvisionContract(sc.id);
	}

	// 2. Delete the receivable payment record for this month on the DJ residency contract
	const monthLabel = formatMonthLabel(month);
	const allPayments = await getPaymentsByContract(contractId);
	const monthPayment = allPayments.find(
		(p) => p.label === monthLabel && p.direction === 'receivable'
	);
	if (monthPayment) {
		await deletePayment(monthPayment.id);
	}

	// 3. Reset performances for this month to uninvoiced
	const performancesRef = collection(db, COLLECTION_NAME, contractId, PERFORMANCES_SUBCOLLECTION);
	const perfQuery = query(performancesRef, where('invoiceMonth', '==', month));
	const snapshot = await getDocs(perfQuery);

	const batch = writeBatch(db);
	snapshot.docs.forEach((d) => {
		batch.update(d.ref, {
			invoiced: false,
			invoiceMonth: null,
			updatedAt: serverTimestamp()
		});
	});
	await batch.commit();
}
