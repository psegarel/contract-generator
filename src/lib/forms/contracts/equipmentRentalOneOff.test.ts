import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	buildEquipmentRentalOneOffContractInput,
	saveEquipmentRentalOneOffForm,
	validateEquipmentRentalOneOffForm,
	type EquipmentRentalOneOffFormValues
} from './equipmentRentalOneOff';

const mocks = vi.hoisted(() => ({
	saveContract: vi.fn(),
	updateContract: vi.fn(),
	createPayment: vi.fn(),
	deletePayments: vi.fn()
}));

vi.mock('$lib/utils/v2/equipmentRentalOneOffContracts', () => ({
	saveEquipmentRentalOneOffContract: mocks.saveContract,
	updateEquipmentRentalOneOffContract: mocks.updateContract
}));

vi.mock('$lib/utils/v2/payments', () => ({
	createOneTimePayment: mocks.createPayment,
	deletePaymentsByContract: mocks.deletePayments
}));

const values: EquipmentRentalOneOffFormValues = {
	contractNumber: 'EQR-20260923-1234',
	eventId: 'event-1',
	counterpartyId: 'client-1',
	paymentStatus: 'unpaid',
	contractValue: 25_000_000,
	notes: '',
	quotationReference: 'QT-2026-001',
	eventName: 'Corporate Gala Dinner',
	eventDate: '2026-10-10',
	setupDateTime: '2026-10-09T18:00',
	collectionDateTime: '2026-10-11T02:00',
	venueName: 'Địa điểm sự kiện',
	venueNameEnglish: 'Event Venue',
	venueAddress: 'Địa chỉ',
	venueAddressEnglish: 'Address',
	deposit: 5_000_000,
	vatRate: 8,
	replacementValue: 30_000_000,
	balancePaymentDays: 7,
	latePaymentPenaltyRate: 0.1,
	latePaymentPenaltyCap: 8,
	cancellationTier1Days: 14,
	cancellationTier1Percent: 50,
	cancellationTier2Days: 7,
	cancellationTier2Percent: 100,
	equipmentList: 'DJ controller\nSpeakers'
};

describe('equipment rental one-off form workflow', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('builds the persisted input from form values', () => {
		const input = buildEquipmentRentalOneOffContractInput(values, 'owner-1', 'Client');

		expect(input).toMatchObject({
			type: 'equipment-rental-oneoff',
			ownerUid: 'owner-1',
			counterpartyName: 'Client',
			eventId: 'event-1',
			contractValue: values.contractValue,
			quotationReference: values.quotationReference,
			equipmentList: values.equipmentList
		});
	});

	it('returns prerequisite validation errors before persistence', () => {
		expect(validateEquipmentRentalOneOffForm({ ...values, eventDate: '' }, 'owner-1')).toBe(
			'Please set the event date'
		);
		expect(validateEquipmentRentalOneOffForm(values, null)).toBe(
			'You must be logged in to create a contract'
		);
		expect(mocks.saveContract).not.toHaveBeenCalled();
	});

	it('saves the contract and regenerates its payment record', async () => {
		mocks.saveContract.mockResolvedValue('contract-1');

		await expect(
			saveEquipmentRentalOneOffForm({
				values,
				ownerUid: 'owner-1',
				counterpartyName: 'Client'
			})
		).resolves.toBe('contract-1');

		expect(mocks.saveContract).toHaveBeenCalledWith(
			buildEquipmentRentalOneOffContractInput(values, 'owner-1', 'Client')
		);
		expect(mocks.createPayment).toHaveBeenCalledWith(
			expect.objectContaining({ id: 'contract-1', contractValue: values.contractValue }),
			values.eventDate
		);
	});
});
