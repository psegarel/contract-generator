import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	buildDjResidencyContractInput,
	saveDjResidencyForm,
	validateDjResidencyForm,
	type DjResidencyFormValues
} from './djResidency';

const mocks = vi.hoisted(() => ({
	saveDjResidencyContract: vi.fn(),
	updateDjResidencyContract: vi.fn()
}));

vi.mock('$lib/utils/v2/djResidencyContracts', () => ({
	saveDjResidencyContract: mocks.saveDjResidencyContract,
	updateDjResidencyContract: mocks.updateDjResidencyContract
}));

vi.mock('$lib/utils/v2/counterparties', () => ({
	saveCounterparty: vi.fn()
}));

const values: DjResidencyFormValues = {
	contractNumber: 'DJR-20260923-1234',
	counterpartyId: 'venue-1',
	paymentStatus: 'unpaid',
	notes: '',
	contractStartDate: '2026-09-23',
	contractEndDate: '2026-12-23',
	contractDurationMonths: 3,
	performanceDays: 'Saturday and Sunday',
	numberOfSetsPerDay: 2,
	performanceFeeVND: 4_000_000,
	terminationNoticeDays: 7,
	residencyStatus: 'active'
};

describe('DJ residency form workflow', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('builds the persisted input from form values', () => {
		expect(buildDjResidencyContractInput(values, 'owner-1', 'Venue')).toEqual({
			type: 'dj-residency',
			ownerUid: 'owner-1',
			contractNumber: values.contractNumber,
			eventId: null,
			counterpartyId: values.counterpartyId,
			counterpartyName: 'Venue',
			eventName: null,
			paymentDirection: 'receivable',
			paymentStatus: values.paymentStatus,
			contractValue: 0,
			currency: 'VND',
			notes: null,
			contractStartDate: values.contractStartDate,
			contractEndDate: values.contractEndDate,
			contractDurationMonths: values.contractDurationMonths,
			performanceDays: values.performanceDays,
			numberOfSetsPerDay: values.numberOfSetsPerDay,
			performanceFeeVND: values.performanceFeeVND,
			terminationNoticeDays: values.terminationNoticeDays,
			residencyStatus: values.residencyStatus
		});
	});

	it('returns prerequisite validation errors without touching persistence', () => {
		expect(validateDjResidencyForm({ ...values, counterpartyId: '' }, 'owner-1')).toBe(
			'Please select a counterparty (Party B)'
		);
		expect(validateDjResidencyForm(values, null)).toBe(
			'You must be logged in to create a contract'
		);
		expect(mocks.saveDjResidencyContract).not.toHaveBeenCalled();
	});

	it('delegates a valid new contract to the domain persistence utility', async () => {
		mocks.saveDjResidencyContract.mockResolvedValue('contract-1');

		await expect(
			saveDjResidencyForm({
				values,
				ownerUid: 'owner-1',
				counterpartyName: 'Venue'
			})
		).resolves.toBe('contract-1');

		expect(mocks.saveDjResidencyContract).toHaveBeenCalledWith(
			buildDjResidencyContractInput(values, 'owner-1', 'Venue')
		);
	});
});
