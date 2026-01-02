import { z } from 'zod';

/**
 * Event Planning Services Contract Schema - Modular Approach
 *
 * Broken into 6 section schemas for progressive validation during step-by-step form filling.
 * Each section can be validated independently, with a final combined schema for Firebase storage.
 */

// ===== SECTION 1: CONTRACT INFORMATION =====
export const contractInfoSchema = z.object({
	contractDate: z.string().min(1, 'Contract date is required'),
	contractLocation: z.string().min(1, 'Contract location is required')
});

// ===== SECTION 2: CLIENT INFORMATION (PARTY A) =====
export const clientInfoSchema = z.object({
	clientCompany: z.string().min(1, 'Client company name is required'),
	clientAddress: z.string().min(1, 'Client address is required'),
	clientTaxCode: z.string().min(1, 'Client tax code is required'),
	clientRepresentativeName: z.string().min(1, 'Client representative name is required'),
	clientRepresentativePosition: z.string().min(1, 'Client representative position is required')
});

// ===== SECTION 3: EVENT INFORMATION =====
export const eventInfoSchema = z.object({
	eventTheme: z.string().nullable().default(null),
	eventName: z.string().min(1, 'Event name is required'),
	eventType: z.string().nullable().default(null),
	eventDescription: z.string().nullable().default(null),
	eventVenue: z.string().min(1, 'Event venue is required'),
	eventDate: z.string().min(1, 'Event date is required'),
	eventDuration: z.string().nullable().default(null),
	expectedAttendance: z.string().nullable().default(null)
});

// ===== SECTION 4: FINANCIAL TERMS =====
export const financialTermsSchema = z.object({
	contractValueVND: z.number().min(0, 'Contract value must be a positive number'),
	vatRate: z
		.number()
		.min(0, 'VAT rate must be at least 0%')
		.max(100, 'VAT rate cannot exceed 100%'),
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
		.min(0, 'Professional indemnity amount must be a positive number'),
	publicLiabilityAmount: z.number().min(0, 'Public liability amount must be a positive number')
}).refine(
	(data) => data.depositPercentage + data.finalPaymentPercentage === 100,
	{
		message: 'Deposit and final payment percentages must sum to 100%',
		path: ['finalPaymentPercentage']
	}
);

// ===== SECTION 5: TIMELINE =====
export const timelineSchema = z.object({
	planningMeetingDays: z
		.number()
		.min(1, 'Planning meeting days must be at least 1')
		.int('Planning meeting days must be a whole number'),
	performerBookingDeadline: z.string().min(1, 'Performer booking deadline is required'),
	technicalSetupDate: z.string().min(1, 'Technical setup date is required'),
	eventExecutionDate: z.string().min(1, 'Event execution date is required'),
	setupCommencementTime: z.string().min(1, 'Setup commencement time is required'),
	eventExecutionDuration: z.string().min(1, 'Event execution duration is required'),
	breakdownCompletionDateTime: z.string().min(1, 'Breakdown completion date/time is required')
});

// ===== SECTION 6: LEGAL TERMS =====
export const legalTermsSchema = z.object({
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
	arbitrationLanguage: z.string().min(1, 'Arbitration language is required')
});

/**
 * COMBINED SCHEMA: Merges all 6 sections for final validation
 *
 * Use section schemas for progressive validation during form filling.
 * Use this combined schema for final validation before Firebase storage.
 */
export const eventPlanningContractSchema = contractInfoSchema
	.merge(clientInfoSchema)
	.merge(eventInfoSchema)
	.merge(financialTermsSchema)
	.merge(timelineSchema)
	.merge(legalTermsSchema)
	.refine(
		(data) => {
			// Cross-section validation: event date must be on/after contract date
			const contractDate = new Date(data.contractDate);
			const eventDate = new Date(data.eventDate);
			return eventDate >= contractDate;
		},
		{
			message: 'Event date must be on or after contract date',
			path: ['eventDate']
		}
	);

/**
 * TypeScript types inferred from schemas
 */
export type ContractInfo = z.infer<typeof contractInfoSchema>;
export type ClientInfo = z.infer<typeof clientInfoSchema>;
export type EventInfo = z.infer<typeof eventInfoSchema>;
export type FinancialTerms = z.infer<typeof financialTermsSchema>;
export type Timeline = z.infer<typeof timelineSchema>;
export type LegalTerms = z.infer<typeof legalTermsSchema>;
export type EventPlanningContractData = z.infer<typeof eventPlanningContractSchema>;
