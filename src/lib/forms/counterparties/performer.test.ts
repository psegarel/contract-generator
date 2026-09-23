import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	buildPerformerInput,
	savePerformerForm,
	toInlinePerformerFormValues,
	type PerformerFormValues
} from './performer';

const mocks = vi.hoisted(() => ({
	saveCounterparty: vi.fn(),
	updateCounterparty: vi.fn()
}));

vi.mock('$lib/utils/v2/counterparties', () => ({
	saveCounterparty: mocks.saveCounterparty,
	updateCounterparty: mocks.updateCounterparty
}));

const values: PerformerFormValues = {
	name: 'Nguyen Van B',
	stageName: 'DJ B',
	email: 'dj@example.com',
	phone: '+84 123 456 789',
	address: 'Ho Chi Minh City',
	performerType: 'DJ',
	genre: 'House',
	technicalRider: 'CDJ-3000',
	minPerformanceDuration: 120,
	travelRequirements: 'Local only',
	agentName: 'Agency',
	agentContact: 'agency@example.com',
	bankName: 'Vietcombank',
	bankAccountNumber: '1234567890',
	idDocument: 'ID-001',
	taxId: 'TAX-001',
	pitRate: 10,
	pitRatePolicy: 'Withholding tax is deducted from the fee',
	notes: ''
};

describe('performer form workflow', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('builds the persisted input from form values', () => {
		expect(buildPerformerInput(values, 'owner-1')).toMatchObject({
			type: 'contractor',
			contractorType: 'performer',
			ownerUid: 'owner-1',
			name: values.name,
			stageName: values.stageName,
			pitRate: values.pitRate
		});
	});

	it('maps inline performer values to the full form shape', () => {
		expect(
			toInlinePerformerFormValues({
				name: 'Legal Name',
				stageName: 'DJ Name',
				performerType: 'DJ',
				genre: 'House',
				email: '',
				phone: '',
				bankName: '',
				bankAccountNumber: '',
				idDocument: '',
				taxId: '',
				pitRate: 10
			})
		).toMatchObject({ stageName: 'DJ Name', technicalRider: '', pitRate: 10 });
	});

	it('rejects unauthenticated submissions before persistence', async () => {
		await expect(savePerformerForm({ values, ownerUid: null })).rejects.toThrow(
			'You must be logged in to create a performer'
		);
		expect(mocks.saveCounterparty).not.toHaveBeenCalled();
	});

	it('saves a valid new performer', async () => {
		mocks.saveCounterparty.mockResolvedValue('performer-1');

		await expect(savePerformerForm({ values, ownerUid: 'owner-1' })).resolves.toBe('performer-1');

		expect(mocks.saveCounterparty).toHaveBeenCalledWith(
			expect.objectContaining({
				type: 'contractor',
				contractorType: 'performer',
				ownerUid: 'owner-1',
				stageName: values.stageName
			})
		);
	});
});
