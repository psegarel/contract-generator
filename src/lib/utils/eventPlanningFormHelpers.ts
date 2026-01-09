import type { EventPlanningContractData } from '$lib/schemas/eventPlanningContract';
import type { ZodType } from 'zod';
import { formatCurrency as formatCurrencyUtil } from './formatting';
import { generateContractNumber } from './contractHelpers';

/**
 * Business logic utilities for event planning contract form
 * All calculations, validations, and data transformations are externalized here
 */

/**
 * Validate data against a Zod schema and return field-level errors
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @param touchedFields - Map of which fields have been touched (only show errors for these)
 * @returns Object with displayErrors (for UI) and allErrors (all validation errors)
 */
export function validateWithSchema<T>(
	schema: ZodType<T>,
	data: T,
	touchedFields: Record<string, boolean>
): {
	isValid: boolean;
	displayErrors: Record<string, string>;
	allErrors: Record<string, string>;
} {
	const result = schema.safeParse(data);

	if (result.success) {
		return {
			isValid: true,
			displayErrors: {},
			allErrors: {}
		};
	}

	// Convert Zod errors to field-level error map
	const displayErrors: Record<string, string> = {};
	const allErrors: Record<string, string> = {};

	result.error.issues.forEach((err) => {
		const fieldName = err.path[0] as string;
		if (fieldName) {
			allErrors[fieldName] = err.message;
			// Only show errors for touched fields
			if (touchedFields[fieldName]) {
				displayErrors[fieldName] = err.message;
			}
		}
	});

	return {
		isValid: false,
		displayErrors,
		allErrors
	};
}

/**
 * Calculate VAT amount from contract value and VAT rate
 */
export function calculateVATAmount(contractValue: number, vatRate: number): number {
	return Math.round(contractValue * (vatRate / 100));
}

/**
 * Calculate total contract value including VAT
 */
export function calculateTotalWithVAT(contractValue: number, vatRate: number): number {
	return contractValue + calculateVATAmount(contractValue, vatRate);
}

/**
 * Calculate deposit amount from total and percentage
 */
export function calculateDepositAmount(total: number, percentage: number): number {
	return Math.round(total * (percentage / 100));
}

/**
 * Calculate final payment amount from total and deposit percentage
 */
export function calculateFinalPayment(total: number, depositPercentage: number): number {
	const finalPaymentPercentage = 100 - depositPercentage;
	return Math.round(total * (finalPaymentPercentage / 100));
}

/**
 * Format contract number from date and client company
 * Re-export from canonical contract helpers (limited to 3 initials for event planning)
 */
export function formatContractNumber(clientCompany: string): string {
	return generateContractNumber(clientCompany, 3);
}

/**
 * Get initial/default form data for event planning contract
 */
export function getInitialFormData(): EventPlanningContractData {
	return {
		// Contract Information
		contractDate: '',
		contractLocation: '',

		// Client Information
		clientCompany: '',
		clientAddress: '',
		clientTaxCode: '',
		clientRepresentativeName: '',
		clientRepresentativePosition: '',

		// Event Information
		eventTheme: null,
		eventName: '',
		eventType: null,
		eventDescription: null,
		eventVenue: '',
		eventDate: '',
		eventDuration: null,
		expectedAttendance: null,

		// Financial Terms
		contractValueVND: 0,
		vatRate: 10, // Default 10%
		depositPercentage: 30, // Default 30%
		finalPaymentPercentage: 70, // Default 70%
		professionalIndemnityAmount: 0,
		publicLiabilityAmount: 0,

		// Timeline
		planningMeetingDays: 7, // Default 7 days
		performerBookingDeadline: '',
		technicalSetupDate: '',
		eventExecutionDate: '',
		setupCommencementTime: '',
		eventExecutionDuration: '',
		breakdownCompletionDateTime: '',

		// Legal Terms
		paymentGracePeriodDays: 30, // Default 30 days
		terminationNoticeDays: 30, // Default 30 days
		negotiationPeriodDays: 30, // Default 30 days
		arbitrationLocation: '',
		arbitrationLanguage: 'English / Tiếng Anh' // Default bilingual
	};
}

/**
 * Format currency for display (Vietnamese locale)
 * Re-export from canonical formatting utilities
 */
export { formatCurrencyUtil as formatCurrency };

/**
 * Format percentage for display
 */
export function formatPercentage(value: number): string {
	return `${value}%`;
}
