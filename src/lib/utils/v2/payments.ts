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
	Timestamp,
	type Unsubscribe
} from 'firebase/firestore';
import { db } from '$lib/config/firebase';
import type { Payment } from '$lib/types/v2/payment';
import type { BaseContract, ContractType } from '$lib/types/v2';
import { paymentInputSchema, type PaymentInput } from '$lib/schemas/v2/payment';
import { logger } from '../logger';
import {
	updateServiceProvisionContractPaymentStatus,
	getServiceProvisionContractById
} from './serviceProvisionContracts';
import {
	updateEventPlanningContractPaymentStatus,
	getEventPlanningContractById
} from './eventPlanningContracts';
import { updateVenueRentalContractPaymentStatus } from './venueRentalContracts';
import { updatePerformerBookingContractPaymentStatus } from './performerBookingContracts';
import { updateEquipmentRentalContractPaymentStatus } from './equipmentRentalContracts';
import { updateSubcontractorContractPaymentStatus } from './subcontractorContracts';
import { updateClientServiceContractPaymentStatus } from './clientServiceContracts';

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
			dueDate: Timestamp.fromDate(installment.dueDate),
			ownerUid: contract.ownerUid,
			notes: null
		});
		ids.push(id);
	}
	return ids;
}

/**
 * Create a one-time payment record for a contract
 * @param contract - Base contract data
 * @param paymentDueDate - ISO date string for when payment is due
 */
export async function createOneTimePayment(
	contract: BaseContract,
	paymentDueDate: string
): Promise<string> {
	// Convert ISO date string to Timestamp
	const dueDate = Timestamp.fromDate(new Date(paymentDueDate));

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
		dueDate,
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
 * Sync contract-level paymentStatus based on payment records.
 * If all payments are paid → contract is "paid".
 * If any payment is pending → contract is "unpaid".
 */
export async function syncContractStatusFromPayments(
	contractId: string,
	contractType: ContractType,
	adminUid: string
): Promise<void> {
	const payments = await getPaymentsByContract(contractId);

	if (payments.length === 0) return;

	const allPaid = payments.every((p) => p.status === 'paid');
	const newStatus: 'paid' | 'unpaid' = allPaid ? 'paid' : 'unpaid';

	const updateFunctions: Record<
		ContractType,
		(id: string, status: 'unpaid' | 'paid', uid: string) => Promise<void>
	> = {
		'service-provision': updateServiceProvisionContractPaymentStatus,
		'event-planning': updateEventPlanningContractPaymentStatus,
		'venue-rental': updateVenueRentalContractPaymentStatus,
		'performer-booking': updatePerformerBookingContractPaymentStatus,
		'equipment-rental': updateEquipmentRentalContractPaymentStatus,
		subcontractor: updateSubcontractorContractPaymentStatus,
		'client-service': updateClientServiceContractPaymentStatus
	};

	await updateFunctions[contractType](contractId, newStatus, adminUid);
}

/**
 * Sync payment records when contract payment status is toggled.
 * If no payment records exist for a one-time contract, creates one automatically.
 * Updates all payment records for the contract to the new status.
 */
export async function syncContractPaymentStatus(
	contract: BaseContract & { paymentDueDate?: string },
	newStatus: 'paid' | 'unpaid',
	adminUid: string
): Promise<void> {
	const payments = await getPaymentsByContract(contract.id);

	if (payments.length === 0) {
		// Auto-create a one-time payment record
		// Use paymentDueDate if available, otherwise fallback to today's date
		const dueDate =
			contract.paymentDueDate || new Date().toISOString().split('T')[0];
		await createOneTimePayment(
			{
				...contract,
				paymentStatus: newStatus === 'paid' ? 'paid' : 'unpaid'
			},
			dueDate
		);
		return;
	}

	// Update all existing payment records
	const paymentStatus = newStatus === 'paid' ? 'paid' : 'pending';
	for (const payment of payments) {
		await updatePaymentStatus(payment.id, paymentStatus, adminUid);
	}
}

// ----- Migration Utilities -----

const MONTH_NAMES: Record<string, number> = {
	january: 0,
	february: 1,
	march: 2,
	april: 3,
	may: 4,
	june: 5,
	july: 6,
	august: 7,
	september: 8,
	october: 9,
	november: 10,
	december: 11
};

/**
 * Parse a label like "November 2025" into a Date (5th of that month)
 */
function parseLabelToDate(label: string): Date | null {
	const parts = label.trim().toLowerCase().split(/\s+/);
	if (parts.length !== 2) return null;

	const [monthName, yearStr] = parts;
	const month = MONTH_NAMES[monthName];
	const year = parseInt(yearStr, 10);

	if (month === undefined || isNaN(year)) return null;

	return new Date(year, month, 5);
}

export interface MigrationResult {
	total: number;
	migrated: number;
	skipped: number;
	errors: string[];
}

/**
 * Migrate payment records that have a label but no dueDate.
 * Parses the label (e.g., "November 2025") and sets dueDate to the 1st of that month.
 */
export async function migratePaymentDueDates(payments: Payment[]): Promise<MigrationResult> {
	const result: MigrationResult = {
		total: 0,
		migrated: 0,
		skipped: 0,
		errors: []
	};

	// Filter payments needing migration (have label but no dueDate)
	const paymentsToMigrate = payments.filter((p) => p.label && !p.dueDate);
	result.total = paymentsToMigrate.length;

	if (paymentsToMigrate.length === 0) {
		return result;
	}

	// Process each payment
	for (const payment of paymentsToMigrate) {
		const parsedDate = parseLabelToDate(payment.label!);

		if (!parsedDate) {
			result.skipped++;
			result.errors.push(`${payment.id}: Invalid label format "${payment.label}"`);
			continue;
		}

		try {
			const docRef = doc(db, COLLECTION_NAME, payment.id);
			await updateDoc(docRef, {
				dueDate: Timestamp.fromDate(parsedDate),
				updatedAt: serverTimestamp()
			});
			result.migrated++;
		} catch (error) {
			result.skipped++;
			result.errors.push(`${payment.id}: ${(error as Error).message}`);
		}
	}

	return result;
}

/**
 * Migrate one-time payment records that have no dueDate.
 * Looks up the contract and uses the relevant date field:
 * - event-planning: eventDate
 * - service-provision: startDate
 * - Other types: uses contract createdAt as fallback
 */
export async function migrateOneTimePaymentDueDates(
	payments: Payment[]
): Promise<MigrationResult> {
	const result: MigrationResult = {
		total: 0,
		migrated: 0,
		skipped: 0,
		errors: []
	};

	// Filter one-time payments needing migration (no dueDate)
	const paymentsToMigrate = payments.filter(
		(p) => p.paymentType === 'one-time' && !p.dueDate
	);
	result.total = paymentsToMigrate.length;

	if (paymentsToMigrate.length === 0) {
		return result;
	}

	// Process each payment
	for (const payment of paymentsToMigrate) {
		try {
			let dateStr: string | null = null;

			// Look up contract based on type to get the relevant date
			if (payment.contractType === 'event-planning') {
				const contract = await getEventPlanningContractById(payment.contractId);
				if (contract) {
					dateStr = contract.eventDate;
				}
			} else if (payment.contractType === 'service-provision') {
				const contract = await getServiceProvisionContractById(payment.contractId);
				if (contract) {
					dateStr = contract.startDate;
				}
			}

			// Fallback: use payment createdAt if no date found
			if (!dateStr) {
				const createdAtDate = payment.createdAt.toDate();
				dateStr = createdAtDate.toISOString().split('T')[0];
				logger.warn(
					`Payment ${payment.id}: Using createdAt as fallback for dueDate`
				);
			}

			const docRef = doc(db, COLLECTION_NAME, payment.id);
			await updateDoc(docRef, {
				dueDate: Timestamp.fromDate(new Date(dateStr)),
				updatedAt: serverTimestamp()
			});
			result.migrated++;
		} catch (error) {
			result.skipped++;
			result.errors.push(`${payment.id}: ${(error as Error).message}`);
		}
	}

	return result;
}
