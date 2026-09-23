import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	buildEventPlanningContractInput,
	saveEventPlanningForm,
	validateEventPlanningForm,
	type EventPlanningFormValues
} from './eventPlanning';

const mocks = vi.hoisted(() => ({
	saveContract: vi.fn(),
	updateContract: vi.fn(),
	createPayment: vi.fn(),
	deletePayments: vi.fn()
}));

vi.mock('$lib/utils/v2/eventPlanningContracts', () => ({
	saveEventPlanningContract: mocks.saveContract,
	updateEventPlanningContract: mocks.updateContract
}));

vi.mock('$lib/utils/v2/payments', () => ({
	createOneTimePayment: mocks.createPayment,
	deletePaymentsByContract: mocks.deletePayments
}));

const values: EventPlanningFormValues = {
	contractNumber: 'EVT-20260923-1234',
	eventId: 'event-1',
	counterpartyId: 'client-1',
	paymentStatus: 'unpaid',
	contractValueVND: 100_000_000,
	notes: '',
	contractDate: '2026-09-23',
	contractLocation: 'Ho Chi Minh City',
	clientCompany: 'Client Co.',
	clientAddress: 'Ho Chi Minh City',
	clientTaxCode: 'TAX-001',
	clientRepresentativeName: 'Client Representative',
	clientRepresentativePosition: 'Director',
	eventTheme: 'Annual Gala',
	eventType: 'Gala',
	eventDescription: 'Annual company gathering',
	eventVenue: 'Grand Ballroom',
	eventDate: '2026-10-10',
	eventDuration: '4 hours',
	expectedAttendance: '200',
	vatRate: 10,
	depositPercentage: 50,
	finalPaymentPercentage: 50,
	professionalIndemnityAmount: 0,
	publicLiabilityAmount: 0,
	planningMeetingDays: 7,
	performerBookingDeadline: '2026-09-30',
	technicalSetupDate: '2026-10-09',
	eventExecutionDate: '2026-10-10',
	setupCommencementTime: '12:00',
	eventExecutionDuration: '4 hours',
	breakdownCompletionDateTime: '2026-10-10T23:00',
	paymentGracePeriodDays: 30,
	terminationNoticeDays: 7,
	negotiationPeriodDays: 14,
	arbitrationLocation: 'Ho Chi Minh City',
	arbitrationLanguage: 'Vietnamese',
	paymentDueDate: '2026-10-10'
};

describe('event planning form workflow', () => {
	beforeEach(() => vi.clearAllMocks());

	it('builds the persisted input from form values', () => {
		expect(
			buildEventPlanningContractInput(values, 'owner-1', 'Annual Gala', 'Client Co.')
		).toMatchObject({
			type: 'event-planning',
			ownerUid: 'owner-1',
			eventName: 'Annual Gala',
			counterpartyName: 'Client Co.',
			contractValue: values.contractValueVND,
			paymentDueDate: values.paymentDueDate
		});
	});

	it('returns prerequisite validation errors before persistence', () => {
		expect(validateEventPlanningForm({ ...values, eventId: '' }, 'owner-1')).toBe(
			'Please select an event'
		);
		expect(validateEventPlanningForm(values, null)).toBe(
			'You must be logged in to create a contract'
		);
	});

	it('saves the contract and creates its payment record', async () => {
		mocks.saveContract.mockResolvedValue('contract-1');

		await expect(
			saveEventPlanningForm({
				values,
				ownerUid: 'owner-1',
				eventName: 'Annual Gala',
				counterpartyName: 'Client Co.'
			})
		).resolves.toBe('contract-1');

		expect(mocks.saveContract).toHaveBeenCalledWith(
			buildEventPlanningContractInput(values, 'owner-1', 'Annual Gala', 'Client Co.')
		);
		expect(mocks.createPayment).toHaveBeenCalledWith(
			expect.objectContaining({ id: 'contract-1', contractValue: values.contractValueVND }),
			values.paymentDueDate
		);
	});
});
