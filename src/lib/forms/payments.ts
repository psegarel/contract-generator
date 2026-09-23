import type { ContractType } from '$lib/types/v2';
import type { Payment } from '$lib/types/v2/payment';
import {
	syncContractStatusFromPayments,
	updatePaymentAmount,
	updatePaymentStatus
} from '$lib/utils/v2/payments';

export type PaymentStatusFilter = 'all' | 'pending' | 'paid';
export type PaymentDirectionFilter = 'all' | 'receivable' | 'payable';

export interface PaymentFilters {
	status: PaymentStatusFilter;
	direction: PaymentDirectionFilter;
	contractType: string;
	contractId: string | null;
}

export interface PaymentGroup {
	contractNumber: string;
	counterpartyName: string;
	contractType: ContractType;
	contractId: string;
	payments: Payment[];
}

export function filterPayments(payments: Payment[], filters: PaymentFilters): Payment[] {
	return payments.filter((payment) => {
		if (filters.contractId && payment.contractId !== filters.contractId) return false;
		if (filters.status !== 'all' && payment.status !== filters.status) return false;
		if (filters.direction !== 'all' && payment.direction !== filters.direction) return false;
		if (filters.contractType !== 'all' && payment.contractType !== filters.contractType)
			return false;
		return true;
	});
}

export function groupPayments(payments: Payment[]): PaymentGroup[] {
	const groups = new Map<string, PaymentGroup>();

	for (const payment of payments) {
		const existing = groups.get(payment.contractId);
		if (existing) {
			existing.payments.push(payment);
			continue;
		}

		groups.set(payment.contractId, {
			contractNumber: payment.contractNumber,
			counterpartyName: payment.counterpartyName,
			contractType: payment.contractType,
			contractId: payment.contractId,
			payments: [payment]
		});
	}

	for (const group of groups.values()) {
		group.payments.reverse();
	}

	return Array.from(groups.values());
}

export function getContractTypeLabel(type: string): string {
	const labels: Record<string, string> = {
		'venue-rental': 'Venue',
		'performer-booking': 'Performer',
		'equipment-rental': 'Equipment',
		'equipment-rental-oneoff': 'Equipment (One-Off)',
		'service-provision': 'Service',
		'event-planning': 'Event Planning',
		subcontractor: 'Subcontractor',
		'client-service': 'Client Service',
		'dj-residency': 'DJ Residency'
	};

	return labels[type] ?? type;
}

export async function togglePayment(payment: Payment, adminUid: string | null | undefined) {
	if (!adminUid) {
		throw new Error('You must be logged in');
	}

	const newStatus = payment.status === 'paid' ? 'pending' : 'paid';
	await updatePaymentStatus(payment.id, newStatus, adminUid);
	await syncContractStatusFromPayments(payment.contractId, payment.contractType, adminUid);
	return newStatus;
}

export async function savePaymentAmount(paymentId: string, amount: number): Promise<void> {
	await updatePaymentAmount(paymentId, amount);
}
