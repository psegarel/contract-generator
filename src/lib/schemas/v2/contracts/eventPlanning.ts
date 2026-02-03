import { z } from 'zod';
import { baseContractSchema, baseContractInputSchema } from '../baseContract';

/**
 * Common event planning fields (used by both full and input schemas)
 */
const eventPlanningFields = {
	type: z.literal('event-planning'),
	paymentDirection: z.literal('receivable'),

	// Section 1: Contract Info
	contractDate: z.string().min(1, 'Contract date is required'),
	contractLocation: z.string().min(1, 'Contract location is required'),

	// Section 2: Client Info (for PDF generation - also in counterparty)
	clientCompany: z.string().min(1, 'Client company name is required'),
	clientAddress: z.string().min(1, 'Client address is required'),
	clientTaxCode: z.string().min(1, 'Client tax code is required'),
	clientRepresentativeName: z.string().min(1, 'Client representative name is required'),
	clientRepresentativePosition: z
		.string()
		.min(1, 'Client representative position is required'),

	// Section 3: Event Info
	eventTheme: z.string().nullable().optional(),
	eventType: z.string().nullable().optional(),
	eventDescription: z.string().nullable().optional(),
	eventVenue: z.string().min(1, 'Event venue is required'),
	eventDate: z.string().min(1, 'Event date is required'),
	eventDuration: z.string().nullable().optional(),
	expectedAttendance: z.string().nullable().optional(),

	// Section 4: Financial Terms
	contractValueVND: z.number().min(0, 'Contract value must be positive'),
	vatRate: z.number().min(0, 'VAT rate must be at least 0%').max(100, 'VAT rate cannot exceed 100%'),
	depositPercentage: z
		.number()
		.min(0, 'Deposit percentage must be at least 0%')
		.max(100, 'Deposit percentage cannot exceed 100%'),
	finalPaymentPercentage: z
		.number()
		.min(0, 'Final payment percentage must be at least 0%')
		.max(100, 'Final payment percentage cannot exceed 100%'),
	professionalIndemnityAmount: z
		.number()
		.min(0, 'Professional indemnity amount must be positive'),
	publicLiabilityAmount: z.number().min(0, 'Public liability amount must be positive'),

	// Section 5: Timeline
	planningMeetingDays: z
		.number()
		.min(1, 'Planning meeting days must be at least 1')
		.int('Planning meeting days must be a whole number'),
	performerBookingDeadline: z.string().min(1, 'Performer booking deadline is required'),
	technicalSetupDate: z.string().min(1, 'Technical setup date is required'),
	eventExecutionDate: z.string().min(1, 'Event execution date is required'),
	setupCommencementTime: z.string().min(1, 'Setup commencement time is required'),
	eventExecutionDuration: z.string().min(1, 'Event execution duration is required'),
	breakdownCompletionDateTime: z
		.string()
		.min(1, 'Breakdown completion date/time is required'),

	// Section 6: Legal Terms
	paymentGracePeriodDays: z
		.number()
		.min(1, 'Payment grace period must be at least 1 day')
		.int('Payment grace period must be a whole number'),
	terminationNoticeDays: z
		.number()
		.min(1, 'Termination notice period must be at least 1 day')
		.int('Termination notice period must be a whole number'),
	negotiationPeriodDays: z
		.number()
		.min(1, 'Negotiation period must be at least 1 day')
		.int('Negotiation period must be a whole number'),
	arbitrationLocation: z.string().min(1, 'Arbitration location is required'),
	arbitrationLanguage: z.string().min(1, 'Arbitration language is required'),

	// Section 7: Payment Terms
	paymentDueDate: z.string().min(1, 'Payment due date is required')
};

/**
 * Event Planning Contract Schema (full schema with paidAt/paidBy)
 * Migrated from old event-planning-contracts collection
 * Keep all fields from old schema for compatibility
 * Note: Event Planning contracts require an event
 */
export const eventPlanningContractSchema = baseContractSchema
	.extend(eventPlanningFields)
	.extend({
		eventId: z.string().min(1, 'Event ID is required'), // Override: required for event planning
		eventName: z.string().min(1, 'Event name is required') // Override: required for event planning
	})
	.strict()
	.refine((data) => data.depositPercentage + data.finalPaymentPercentage === 100, {
		message: 'Deposit and final payment percentages must sum to 100%',
		path: ['finalPaymentPercentage']
	});

/**
 * Input schema for creation (no paidAt/paidBy fields)
 * Note: Event Planning contracts require an event
 */
export const eventPlanningContractInputSchema = baseContractInputSchema
	.extend(eventPlanningFields)
	.extend({
		eventId: z.string().min(1, 'Event ID is required'), // Override: required for event planning
		eventName: z.string().min(1, 'Event name is required') // Override: required for event planning
	})
	.strict()
	.refine((data) => data.depositPercentage + data.finalPaymentPercentage === 100, {
		message: 'Deposit and final payment percentages must sum to 100%',
		path: ['finalPaymentPercentage']
	});

export type EventPlanningContractInput = z.infer<typeof eventPlanningContractInputSchema>;
