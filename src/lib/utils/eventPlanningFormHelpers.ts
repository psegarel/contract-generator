import type { EventPlanningContractData } from '$lib/schemas/eventPlanningContract';
import type { ZodType } from 'zod';

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
 * Format: YYYYMMDD-INITIALS-TIMESTAMP
 */
export function formatContractNumber(clientCompany: string): string {
	const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
	const initials = clientCompany
		.split(' ')
		.map((n) => n[0])
		.join('')
		.toUpperCase()
		.slice(0, 3); // Limit to 3 characters
	const timestamp = Date.now().toString().slice(-3);
	return `${dateStr}-${initials}-${timestamp}`;
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
		clientNationality: '',
		clientPassportNumber: '',
		clientPassportIssuedDate: '',
		clientPassportIssuedPlace: '',
		clientRepresentativePosition: '',
		clientAuthority: '',

		// Event Information
		eventTheme: undefined,
		eventName: '',
		eventType: undefined,
		eventDescription: undefined,
		eventVenue: '',
		eventDate: '',
		eventDuration: undefined,
		expectedAttendance: undefined,

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
 */
export function formatCurrency(amount: number): string {
	return new Intl.NumberFormat('vi-VN').format(amount);
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number): string {
	return `${value}%`;
}
