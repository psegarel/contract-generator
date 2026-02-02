import type { Timestamp } from 'firebase/firestore';
import type { ContractType } from './base';

/**
 * Payment type discriminator
 * - one-time: Single payment for the full contract value
 * - recurring: Monthly installment (e.g., equipment rental)
 */
export type PaymentType = 'one-time' | 'recurring';

/**
 * Payment record status
 */
export type PaymentRecordStatus = 'pending' | 'paid';

/**
 * Payment record stored in the `payments` Firestore collection.
 * Dashboard stats derive from these records, not contract fields.
 */
export interface Payment {
	id: string;
	contractId: string;
	contractType: ContractType;
	contractNumber: string; // denormalized from contract
	counterpartyName: string; // denormalized from contract
	paymentType: PaymentType;
	amount: number;
	currency: 'VND';
	direction: 'receivable' | 'payable';
	status: PaymentRecordStatus;
	label: string | null; // null for one-time, e.g. "January 2026" for recurring
	dueDate: Timestamp | null;
	paidAt: Timestamp | null;
	paidBy: string | null;
	ownerUid: string;
	createdAt: Timestamp;
	updatedAt: Timestamp;
	notes: string | null;
}
