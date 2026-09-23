import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	buildEquipmentRentalContractInput,
	saveEquipmentRentalForm,
	validateEquipmentRentalForm,
	type EquipmentRentalFormValues
} from './equipmentRental';

const mocks = vi.hoisted(() => ({
	saveContract: vi.fn(),
	updateContract: vi.fn(),
	createPayments: vi.fn(),
	deletePayments: vi.fn()
}));

vi.mock('$lib/utils/v2/equipmentRentalContracts', () => ({
	saveEquipmentRentalContract: mocks.saveContract,
	updateEquipmentRentalContract: mocks.updateContract
}));

vi.mock('$lib/utils/v2/payments', () => ({
	createRecurringPayments: mocks.createPayments,
	deletePaymentsByContract: mocks.deletePayments
}));

const values: EquipmentRentalFormValues = {
	contractNumber: 'EQP-20260923-1234',
	counterpartyId: 'client-1',
	paymentStatus: 'unpaid',
	contractValue: 12_000_000,
	notes: '',
	rentalStartDate: '2026-10-01',
	rentalEndDate: '2026-12-01',
	equipment: [{ name: 'Speakers', quantity: 2, unitPrice: 5_000_000, serialNumbers: [] }],
	monthlyRent: 4_000_000,
	securityDeposit: 2_000_000,
	damageWaiver: false,
	deliveryFee: 500_000,
	venueName: 'Địa điểm',
	venueNameEnglish: 'Venue',
	venueAddress: 'Địa chỉ',
	venueAddressEnglish: 'Address'
};

describe('equipment rental form workflow', () => {
	beforeEach(() => vi.clearAllMocks());

	it('builds the persisted input from form values', () => {
		expect(buildEquipmentRentalContractInput(values, 'owner-1', 'Client')).toMatchObject({
			type: 'equipment-rental',
			ownerUid: 'owner-1',
			counterpartyName: 'Client',
			contractValue: values.contractValue,
			equipment: values.equipment
		});
	});

	it('validates authentication, counterparties, and equipment items', () => {
		expect(validateEquipmentRentalForm(values, null)).toBe(
			'You must be logged in to create a contract'
		);
		expect(validateEquipmentRentalForm({ ...values, equipment: [] }, 'owner-1')).toBe(
			'Please add at least one equipment item'
		);
	});

	it('saves the contract and creates recurring payments', async () => {
		mocks.saveContract.mockResolvedValue('contract-1');

		await expect(
			saveEquipmentRentalForm({ values, ownerUid: 'owner-1', counterpartyName: 'Client' })
		).resolves.toBe('contract-1');

		expect(mocks.saveContract).toHaveBeenCalledWith(
			buildEquipmentRentalContractInput(values, 'owner-1', 'Client')
		);
		expect(mocks.createPayments).toHaveBeenCalledWith(
			expect.objectContaining({ id: 'contract-1', monthlyRent: values.monthlyRent }),
			expect.arrayContaining([expect.objectContaining({ amount: values.monthlyRent })])
		);
	});
});
