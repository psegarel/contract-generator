import { describe, expect, it, vi } from 'vitest';
import { filterPayments, getContractTypeLabel, groupPayments } from './payments';
import type { Payment } from '$lib/types/v2/payment';

vi.mock('$lib/utils/v2/payments', () => ({
	syncContractStatusFromPayments: vi.fn(),
	updatePaymentAmount: vi.fn(),
	updatePaymentStatus: vi.fn()
}));

const payment = (overrides: Partial<Payment> = {}): Payment =>
	({
		id: 'payment-1',
		contractId: 'contract-1',
		contractNumber: 'CON-001',
		contractType: 'dj-residency',
		counterpartyName: 'DJ Example',
		paymentType: 'one-time',
		label: 'Payment',
		amount: 4_000_000,
		currency: 'VND',
		direction: 'receivable',
		status: 'pending',
		dueDate: '2026-10-10',
		ownerUid: 'owner-1',
		createdAt: {} as Payment['createdAt'],
		updatedAt: {} as Payment['updatedAt'],
		...overrides
	}) as Payment;

describe('payments workflow helpers', () => {
	it('filters payments by all active filters', () => {
		const payments = [payment(), payment({ id: 'payment-2', status: 'paid' })];

		expect(
			filterPayments(payments, {
				status: 'paid',
				direction: 'receivable',
				contractType: 'dj-residency',
				contractId: 'contract-1'
			})
		).toHaveLength(1);
	});

	it('groups payments by contract and reverses payment order', () => {
		const groups = groupPayments([
			payment({ id: 'first' }),
			payment({ id: 'second' }),
			payment({ id: 'third', contractId: 'contract-2', contractNumber: 'CON-002' })
		]);

		expect(groups).toHaveLength(2);
		expect(groups[0].payments.map(({ id }) => id)).toEqual(['second', 'first']);
	});

	it('provides readable contract type labels', () => {
		expect(getContractTypeLabel('equipment-rental-oneoff')).toBe('Equipment (One-Off)');
		expect(getContractTypeLabel('unknown')).toBe('unknown');
	});
});
