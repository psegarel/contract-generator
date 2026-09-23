import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	buildServiceProvisionContractInput,
	saveServiceProvisionForm,
	validateServiceProvisionForm,
	type ServiceProvisionFormValues
} from './serviceProvision';

const mocks = vi.hoisted(() => ({
	saveContract: vi.fn(),
	updateContract: vi.fn(),
	createPayment: vi.fn(),
	deletePayments: vi.fn()
}));

vi.mock('$lib/utils/v2/serviceProvisionContracts', () => ({
	saveServiceProvisionContract: mocks.saveContract,
	updateServiceProvisionContract: mocks.updateContract
}));

vi.mock('$lib/utils/v2/payments', () => ({
	createOneTimePayment: mocks.createPayment,
	deletePaymentsByContract: mocks.deletePayments
}));

const values: ServiceProvisionFormValues = {
	contractNumber: 'SVC-20260923-1234',
	eventId: 'event-1',
	counterpartyId: 'provider-1',
	paymentStatus: 'unpaid',
	contractValue: 20_000_000,
	notes: '',
	jobName: 'Catering',
	jobContent: 'Dinner service',
	numberOfPerformances: 1,
	firstPerformanceTime: '18:00',
	startDate: '2026-10-10',
	endDate: '2026-10-10',
	taxRate: 10,
	status: 'draft',
	bankName: 'Vietcombank',
	accountNumber: '1234567890',
	clientEmail: 'client@example.com',
	clientAddress: 'Ho Chi Minh City',
	clientPhone: '+84 123 456 789',
	clientIdDocument: 'ID-001',
	clientTaxId: '',
	eventLocation: 'Grand Ballroom',
	paymentDueDate: '2026-10-10'
};

describe('service provision form workflow', () => {
	beforeEach(() => vi.clearAllMocks());

	it('builds the persisted input from form values', () => {
		expect(buildServiceProvisionContractInput(values, 'owner-1', 'Gala', 'Catering')).toMatchObject(
			{
				type: 'service-provision',
				ownerUid: 'owner-1',
				counterpartyName: 'Catering',
				netFee: values.contractValue,
				paymentDueDate: values.paymentDueDate
			}
		);
	});

	it('returns prerequisite validation errors before persistence', () => {
		expect(validateServiceProvisionForm({ ...values, eventId: '' }, 'owner-1')).toBe(
			'Please select an event'
		);
		expect(validateServiceProvisionForm(values, null)).toBe(
			'You must be logged in to create a contract'
		);
	});

	it('saves the contract and creates its payment record', async () => {
		mocks.saveContract.mockResolvedValue('contract-1');

		await expect(
			saveServiceProvisionForm({
				values,
				ownerUid: 'owner-1',
				eventName: 'Gala',
				counterpartyName: 'Catering'
			})
		).resolves.toBe('contract-1');

		expect(mocks.saveContract).toHaveBeenCalledWith(
			buildServiceProvisionContractInput(values, 'owner-1', 'Gala', 'Catering')
		);
		expect(mocks.createPayment).toHaveBeenCalledWith(
			expect.objectContaining({ id: 'contract-1', contractValue: values.contractValue }),
			values.paymentDueDate
		);
	});
});
