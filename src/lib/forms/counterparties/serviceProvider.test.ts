import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	buildServiceProviderInput,
	saveServiceProviderForm,
	type ServiceProviderFormValues
} from './serviceProvider';

const mocks = vi.hoisted(() => ({
	saveCounterparty: vi.fn(),
	updateCounterparty: vi.fn()
}));

vi.mock('$lib/utils/v2/counterparties', () => ({
	saveCounterparty: mocks.saveCounterparty,
	updateCounterparty: mocks.updateCounterparty
}));

const values: ServiceProviderFormValues = {
	name: 'ABC Catering',
	email: 'hello@example.com',
	phone: '+84 123 456 789',
	address: 'Ho Chi Minh City',
	serviceType: 'Catering',
	companyName: 'ABC Corporation',
	typicalDeliverables: ['200 meals'],
	equipmentProvided: ['Serving equipment'],
	businessLicense: 'LIC-001',
	insuranceInfo: 'Policy 123',
	taxId: 'TAX-001',
	bankName: 'Vietcombank',
	bankAccountNumber: '1234567890',
	idDocument: 'ID-001',
	notes: '',
	documents: {}
};

describe('service provider form workflow', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('builds the persisted input from form values', () => {
		const input = buildServiceProviderInput(values, 'owner-1');

		expect(input).toMatchObject({
			type: 'contractor',
			contractorType: 'service-provider',
			ownerUid: 'owner-1',
			name: values.name,
			serviceType: values.serviceType,
			typicalDeliverables: values.typicalDeliverables,
			equipmentProvided: values.equipmentProvided,
			documents: undefined
		});
	});

	it('rejects unauthenticated submissions before persistence', async () => {
		await expect(saveServiceProviderForm({ values, ownerUid: null })).rejects.toThrow(
			'You must be logged in to create a service provider'
		);
		expect(mocks.saveCounterparty).not.toHaveBeenCalled();
	});

	it('saves a valid new service provider', async () => {
		mocks.saveCounterparty.mockResolvedValue('provider-1');

		await expect(saveServiceProviderForm({ values, ownerUid: 'owner-1' })).resolves.toBe(
			'provider-1'
		);

		expect(mocks.saveCounterparty).toHaveBeenCalledWith(
			expect.objectContaining({
				type: 'contractor',
				contractorType: 'service-provider',
				ownerUid: 'owner-1',
				name: values.name,
				serviceType: values.serviceType,
				typicalDeliverables: values.typicalDeliverables,
				equipmentProvided: values.equipmentProvided
			})
		);
	});
});
