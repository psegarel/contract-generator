import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildClientInput, saveClientForm, type ClientFormValues } from './client';

const mocks = vi.hoisted(() => ({
	saveCounterparty: vi.fn(),
	updateCounterparty: vi.fn()
}));

vi.mock('$lib/utils/v2/counterparties', () => ({
	saveCounterparty: mocks.saveCounterparty,
	updateCounterparty: mocks.updateCounterparty
}));

const values: ClientFormValues = {
	name: 'ABC Corporation',
	email: 'hello@example.com',
	phone: '+84 123 456 789',
	address: 'Ho Chi Minh City',
	clientType: 'company',
	companyName: 'ABC Corporation',
	representativeName: 'Nguyen Van A',
	representativePosition: 'Director',
	idDocument: '',
	taxId: 'TAX-001',
	bankName: 'Vietcombank',
	bankAccountNumber: '1234567890',
	notes: ''
};

describe('client form workflow', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('builds the persisted input from form values', () => {
		expect(buildClientInput(values, 'owner-1')).toMatchObject({
			type: 'client',
			ownerUid: 'owner-1',
			name: values.name,
			clientType: values.clientType,
			companyName: values.companyName
		});
	});

	it('rejects unauthenticated submissions before persistence', async () => {
		await expect(saveClientForm({ values, ownerUid: null })).rejects.toThrow(
			'You must be logged in to create a client'
		);
		expect(mocks.saveCounterparty).not.toHaveBeenCalled();
	});

	it('saves a valid new client', async () => {
		mocks.saveCounterparty.mockResolvedValue('client-1');

		await expect(saveClientForm({ values, ownerUid: 'owner-1' })).resolves.toBe('client-1');

		expect(mocks.saveCounterparty).toHaveBeenCalledWith(
			expect.objectContaining({
				type: 'client',
				ownerUid: 'owner-1',
				name: values.name,
				clientType: values.clientType
			})
		);
	});
});
