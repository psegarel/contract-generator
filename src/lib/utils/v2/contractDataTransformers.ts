import type {
	ServiceProvisionContract,
	EventPlanningContract,
	EquipmentRentalContract
} from '$lib/types/v2/contracts';
import { companyConfig } from '$lib/config/company';
import { translateToVietnamese } from '../translate';
import { formatCurrency, formatDateVietnamese, formatDateEnglish } from '../formatting';
import { generateContractNumber } from '../contractHelpers';
import * as z from 'zod';

/**
 * Calculate financial values for service provision contracts
 * Formula: Gross = Net / (1 - TaxRate)
 * Tax = Gross - Net
 */
export function calculateServiceProvisionFinancials(netFee: number, taxRate: number) {
	const taxRateDecimal = taxRate / 100;
	const grossFee = Math.round(netFee / (1 - taxRateDecimal));
	const taxAmount = grossFee - netFee;
	return {
		netFee,
		taxRate,
		grossFee,
		taxAmount
	};
}

/**
 * Transformed data for service provision contract view/preview
 * This matches the structure used by the document generator
 */
export interface ServiceProvisionContractViewData {
	// Contract Information
	contractNumber: string;

	// Company Information (Party A)
	companyName: string;
	companyAddressLine1: string;
	companyAddressLine2: string;
	companyWard: string;
	companyCity: string;
	companyTaxCode: string;
	companyRepresentative: string;
	companyFunction: string;
	companyRepresentativePhone: string;
	companyRepresentativeEmail: string;

	// Client Information (Party B)
	clientName: string;
	clientEmail: string;
	clientAddress: string;
	clientPhone: string;
	clientIdDocument: string;
	clientTaxId: string;

	// Bank Details
	bankName: string;
	accountNumber: string;

	// Event Details
	jobName: string;
	jobNameVN: string;
	eventName: string; // Normalized: null → empty string
	numberOfPerformances: number;
	eventLocation: string;
	firstPerformanceTime: string;
	jobContent: string;
	jobContentVN: string;

	// Financial Information (formatted)
	netFee: string; // formatted currency
	taxRate: number;
	taxAmount: string; // formatted currency
	grossFee: string; // formatted currency

	// Contract Period
	startDate: string;
	endDate: string;
}

/**
 * Zod schema for validating service provision contract view data
 */
export const serviceProvisionContractViewDataSchema = z.object({
	contractNumber: z.string().min(1),
	companyName: z.string().min(1),
	companyAddressLine1: z.string().min(1),
	companyAddressLine2: z.string().min(1),
	companyWard: z.string().min(1),
	companyCity: z.string().min(1),
	companyTaxCode: z.string().min(1),
	companyRepresentative: z.string().min(1),
	companyFunction: z.string().min(1),
	companyRepresentativePhone: z.string().min(1),
	companyRepresentativeEmail: z.string().email(),
	clientName: z.string().min(1),
	clientEmail: z.string().email(),
	clientAddress: z.string().min(1),
	clientPhone: z.string().min(1),
	clientIdDocument: z.string().min(1),
	clientTaxId: z.string(), // Can be 'N/A' or actual tax ID
	bankName: z.string().min(1),
	accountNumber: z.string().min(1),
	jobName: z.string().min(1),
	jobNameVN: z.string(),
	eventName: z.string(), // Normalized: always string (empty if null)
	numberOfPerformances: z.number().min(1),
	eventLocation: z.string().min(1),
	firstPerformanceTime: z.string().min(1),
	jobContent: z.string().min(1),
	jobContentVN: z.string(),
	netFee: z.string().min(1), // Formatted currency
	taxRate: z.number().min(0).max(100),
	taxAmount: z.string().min(1), // Formatted currency
	grossFee: z.string().min(1), // Formatted currency
	startDate: z.string().min(1),
	endDate: z.string().min(1)
});

/**
 * Transform service provision contract data for view/preview
 * This performs all calculations, formatting, and translations
 * Normalizes null values to empty strings for consistent display
 */
export async function transformServiceProvisionContractData(
	contract: ServiceProvisionContract
): Promise<ServiceProvisionContractViewData> {
	// Generate contract number
	const contractNumber = generateContractNumber(contract.counterpartyName);

	// Calculate financial values
	const { netFee, taxRate, grossFee, taxAmount } = calculateServiceProvisionFinancials(
		contract.netFee,
		contract.taxRate
	);

	// Format currency values
	const netFeeFormatted = formatCurrency(netFee);
	const taxAmountFormatted = formatCurrency(taxAmount);
	const grossFeeFormatted = formatCurrency(grossFee);

	// Translate fields to Vietnamese
	const [jobNameVN, jobContentVN] = await Promise.all([
		translateToVietnamese(contract.jobName),
		translateToVietnamese(contract.jobContent)
	]) as [string, string];

	const result: ServiceProvisionContractViewData = {
		contractNumber,
		companyName: companyConfig.name,
		companyAddressLine1: companyConfig.addressLine1,
		companyAddressLine2: companyConfig.addressLine2,
		companyWard: companyConfig.ward,
		companyCity: companyConfig.city,
		companyTaxCode: companyConfig.taxCode,
		companyRepresentative: companyConfig.representative,
		companyFunction: '', // No longer in config, use empty string for backward compatibility
		companyRepresentativePhone: companyConfig.representativePhone,
		companyRepresentativeEmail: companyConfig.representativeEmail,
		clientName: contract.counterpartyName,
		clientEmail: contract.clientEmail,
		clientAddress: contract.clientAddress,
		clientPhone: contract.clientPhone,
		clientIdDocument: contract.clientIdDocument,
		clientTaxId: contract.clientTaxId ?? 'N/A', // Normalize null to 'N/A'
		bankName: contract.bankName,
		accountNumber: contract.accountNumber,
		jobName: contract.jobName,
		jobNameVN,
		eventName: contract.eventName ?? '', // Normalize null to empty string
		numberOfPerformances: contract.numberOfPerformances,
		eventLocation: contract.eventLocation,
		firstPerformanceTime: contract.firstPerformanceTime,
		jobContent: contract.jobContent,
		jobContentVN,
		netFee: netFeeFormatted,
		taxRate: contract.taxRate,
		taxAmount: taxAmountFormatted,
		grossFee: grossFeeFormatted,
		startDate: contract.startDate,
		endDate: contract.endDate
	};

	// Validate transformed data
	return serviceProvisionContractViewDataSchema.parse(result);
}

/**
 * Transformed data for event planning contract view/preview
 * This matches the structure used by the document generator
 */
export interface EventPlanningContractViewData {
	// Contract Information
	contractNumber: string;
	contractDateVietnamese: string;
	contractDateEnglish: string;
	contractLocationVietnamese: string;
	contractLocationEnglish: string;

	// Client Information (Party A) - Bilingual
	clientCompanyVietnamese: string;
	clientCompanyEnglish: string;
	clientAddressVietnamese: string;
	clientAddressEnglish: string;
	clientTaxCode: string;
	clientRepresentativeName: string;
	clientRepresentativePositionVietnamese: string;
	clientRepresentativePositionEnglish: string;

	// Event Information - Bilingual
	eventThemeVietnamese: string;
	eventThemeEnglish: string;
	eventName: string; // Normalized: null → empty string
	eventTypeVietnamese: string;
	eventTypeEnglish: string;
	eventDescriptionVietnamese: string;
	eventDescriptionEnglish: string;
	eventVenueVietnamese: string;
	eventVenueEnglish: string;
	eventDateVietnamese: string;
	eventDateEnglish: string;
	eventDurationVietnamese: string;
	eventDurationEnglish: string;
	expectedAttendance: string; // Normalized: null → empty string

	// Financial Terms (formatted)
	contractValueVND: string; // formatted currency
	vatRate: string; // formatted as percentage
	depositPercentage: string; // formatted as percentage
	finalPaymentPercentage: string; // formatted as percentage
	professionalIndemnityAmount: string; // formatted currency
	publicLiabilityAmount: string; // formatted currency

	// Timeline
	planningMeetingDays: number;
	performerBookingDeadline: string;
	technicalSetupDate: string;
	eventExecutionDate: string;
	setupCommencementTime: string;
	eventExecutionDuration: string;
	breakdownCompletionDateTime: string;

	// Legal Terms
	paymentGracePeriodDays: number;
	terminationNoticeDays: number;
	negotiationPeriodDays: number;
	arbitrationLocationVietnamese: string;
	arbitrationLocationEnglish: string;
	arbitrationLanguage: string;
}

/**
 * Zod schema for validating event planning contract view data
 */
export const eventPlanningContractViewDataSchema = z.object({
	contractNumber: z.string().min(1),
	contractDateVietnamese: z.string().min(1),
	contractDateEnglish: z.string().min(1),
	contractLocationVietnamese: z.string(),
	contractLocationEnglish: z.string().min(1),
	clientCompanyVietnamese: z.string(),
	clientCompanyEnglish: z.string().min(1),
	clientAddressVietnamese: z.string(),
	clientAddressEnglish: z.string().min(1),
	clientTaxCode: z.string().min(1),
	clientRepresentativeName: z.string().min(1),
	clientRepresentativePositionVietnamese: z.string(),
	clientRepresentativePositionEnglish: z.string().min(1),
	eventThemeVietnamese: z.string(), // Can be empty
	eventThemeEnglish: z.string(), // Can be empty
	eventName: z.string(), // Normalized: always string (empty if null)
	eventTypeVietnamese: z.string(), // Can be empty
	eventTypeEnglish: z.string(), // Can be empty
	eventDescriptionVietnamese: z.string(), // Can be empty
	eventDescriptionEnglish: z.string(), // Can be empty
	eventVenueVietnamese: z.string(),
	eventVenueEnglish: z.string().min(1),
	eventDateVietnamese: z.string().min(1),
	eventDateEnglish: z.string().min(1),
	eventDurationVietnamese: z.string(), // Can be empty
	eventDurationEnglish: z.string(), // Can be empty
	expectedAttendance: z.string(), // Normalized: always string (empty if null)
	contractValueVND: z.string().min(1), // Formatted currency
	vatRate: z.string().regex(/^\d+%$/), // Formatted as percentage
	depositPercentage: z.string().regex(/^\d+%$/), // Formatted as percentage
	finalPaymentPercentage: z.string().regex(/^\d+%$/), // Formatted as percentage
	professionalIndemnityAmount: z.string().min(1), // Formatted currency
	publicLiabilityAmount: z.string().min(1), // Formatted currency
	planningMeetingDays: z.number().min(0),
	performerBookingDeadline: z.string().min(1),
	technicalSetupDate: z.string().min(1),
	eventExecutionDate: z.string().min(1),
	setupCommencementTime: z.string().min(1),
	eventExecutionDuration: z.string().min(1),
	breakdownCompletionDateTime: z.string().min(1),
	paymentGracePeriodDays: z.number().min(0),
	terminationNoticeDays: z.number().min(0),
	negotiationPeriodDays: z.number().min(0),
	arbitrationLocationVietnamese: z.string(),
	arbitrationLocationEnglish: z.string().min(1),
	arbitrationLanguage: z.string().min(1)
});

/**
 * Transform event planning contract data for view/preview
 * This performs all calculations, formatting, and translations
 * Normalizes null values to empty strings for consistent display
 */
export async function transformEventPlanningContractData(
	contract: EventPlanningContract
): Promise<EventPlanningContractViewData> {
	// Generate contract number (limited to 3 initials for event planning)
	const contractNumber = generateContractNumber(contract.clientCompany, 3);

	// Translate English fields to Vietnamese
	const [
		clientCompanyVN,
		clientAddressVN,
		contractLocationVN,
		clientRepresentativePositionVN,
		eventThemeVN,
		eventTypeVN,
		eventDescriptionVN,
		eventVenueVN,
		eventDurationVN,
		arbitrationLocationVN
	] = (await Promise.all([
		translateToVietnamese(contract.clientCompany),
		translateToVietnamese(contract.clientAddress),
		translateToVietnamese(contract.contractLocation),
		translateToVietnamese(contract.clientRepresentativePosition),
		contract.eventTheme ? translateToVietnamese(contract.eventTheme) : Promise.resolve(''),
		contract.eventType ? translateToVietnamese(contract.eventType) : Promise.resolve(''),
		contract.eventDescription
			? translateToVietnamese(contract.eventDescription)
			: Promise.resolve(''),
		translateToVietnamese(contract.eventVenue),
		contract.eventDuration ? translateToVietnamese(contract.eventDuration) : Promise.resolve(''),
		translateToVietnamese(contract.arbitrationLocation)
	])) as [string, string, string, string, string, string, string, string, string, string];

	// Format dates
	const contractDateVietnamese = formatDateVietnamese(contract.contractDate);
	const contractDateEnglish = formatDateEnglish(contract.contractDate);
	const eventDateVietnamese = formatDateVietnamese(contract.eventDate);
	const eventDateEnglish = formatDateEnglish(contract.eventDate);

	// Format currency values
	const contractValueVNDFormatted = formatCurrency(contract.contractValueVND);
	const professionalIndemnityAmountFormatted = formatCurrency(
		contract.professionalIndemnityAmount
	);
	const publicLiabilityAmountFormatted = formatCurrency(contract.publicLiabilityAmount);

	// Format percentages
	const vatRateFormatted = `${contract.vatRate}%`;
	const depositPercentageFormatted = `${contract.depositPercentage}%`;
	const finalPaymentPercentageFormatted = `${contract.finalPaymentPercentage}%`;

	const result: EventPlanningContractViewData = {
		contractNumber,
		contractDateVietnamese,
		contractDateEnglish,
		contractLocationVietnamese: contractLocationVN,
		contractLocationEnglish: contract.contractLocation,
		clientCompanyVietnamese: clientCompanyVN,
		clientCompanyEnglish: contract.clientCompany,
		clientAddressVietnamese: clientAddressVN,
		clientAddressEnglish: contract.clientAddress,
		clientTaxCode: contract.clientTaxCode,
		clientRepresentativeName: contract.clientRepresentativeName,
		clientRepresentativePositionVietnamese: clientRepresentativePositionVN,
		clientRepresentativePositionEnglish: contract.clientRepresentativePosition,
		eventThemeVietnamese: eventThemeVN,
		eventThemeEnglish: contract.eventTheme ?? '', // Normalize null to empty string
		eventName: contract.eventName ?? '', // Normalize null to empty string
		eventTypeVietnamese: eventTypeVN,
		eventTypeEnglish: contract.eventType ?? '', // Normalize null to empty string
		eventDescriptionVietnamese: eventDescriptionVN,
		eventDescriptionEnglish: contract.eventDescription ?? '', // Normalize null to empty string
		eventVenueVietnamese: eventVenueVN,
		eventVenueEnglish: contract.eventVenue,
		eventDateVietnamese,
		eventDateEnglish,
		eventDurationVietnamese: eventDurationVN,
		eventDurationEnglish: contract.eventDuration ?? '', // Normalize null to empty string
		expectedAttendance: contract.expectedAttendance ?? '', // Normalize null to empty string
		contractValueVND: contractValueVNDFormatted,
		vatRate: vatRateFormatted,
		depositPercentage: depositPercentageFormatted,
		finalPaymentPercentage: finalPaymentPercentageFormatted,
		professionalIndemnityAmount: professionalIndemnityAmountFormatted,
		publicLiabilityAmount: publicLiabilityAmountFormatted,
		planningMeetingDays: contract.planningMeetingDays,
		performerBookingDeadline: contract.performerBookingDeadline,
		technicalSetupDate: contract.technicalSetupDate,
		eventExecutionDate: contract.eventExecutionDate,
		setupCommencementTime: contract.setupCommencementTime,
		eventExecutionDuration: contract.eventExecutionDuration,
		breakdownCompletionDateTime: contract.breakdownCompletionDateTime,
		paymentGracePeriodDays: contract.paymentGracePeriodDays,
		terminationNoticeDays: contract.terminationNoticeDays,
		negotiationPeriodDays: contract.negotiationPeriodDays,
		arbitrationLocationVietnamese: arbitrationLocationVN,
		arbitrationLocationEnglish: contract.arbitrationLocation,
		arbitrationLanguage: contract.arbitrationLanguage
	};

	// Validate transformed data
	return eventPlanningContractViewDataSchema.parse(result);
}

/**
 * Transformed data for equipment rental contract view/preview
 * This matches the structure used by the document generator
 */
export interface EquipmentRentalContractViewData {
	// Contract Information
	contractNumber: string;
	eventName: string;

	// Company Information (Party A)
	companyName: string;
	companyNameVietnamese: string;
	companyAddressLine1: string;
	companyAddressLine2: string;
	companyWard: string;
	companyCity: string;
	companyTaxCode: string;
	companyRepresentative: string;
	companyRepresentativePhone: string;
	companyRepresentativeEmail: string;

	// Counterparty Information (Party B)
	counterpartyName: string;
	counterpartyNameVietnamese: string;

	// Rental Period
	rentalStartDate: string;
	rentalStartDateVietnamese: string;
	rentalStartDateEnglish: string;
	rentalEndDate: string;
	rentalEndDateVietnamese: string;
	rentalEndDateEnglish: string;

	// Equipment List (formatted)
	equipment: Array<{
		name: string;
		quantity: number;
		unitPrice: string; // formatted currency
		totalPrice: string; // formatted currency
		serialNumbers: string; // comma-separated or 'N/A'
	}>;
	equipmentCount: number;
	totalEquipmentValue: string; // formatted currency

	// Terms (formatted)
	securityDeposit: string; // formatted currency
	damageWaiver: string; // 'Yes' or 'No'
	damageWaiverVietnamese: string; // 'Có' or 'Không'
	deliveryFee: string; // formatted currency

	// Logistics
	venueName: string;
	venueNameEnglish: string;
	venueAddress: string;
	venueAddressEnglish: string;

	// Financial (formatted)
	contractValue: string; // formatted currency
	totalContractValue: string; // formatted currency
	currency: string;

	// Payment
	paymentDirection: string; // 'Receivable' or 'Payable'
	paymentDirectionVietnamese: string; // 'Phải thu' or 'Phải trả'
	paymentStatus: string; // 'Paid' or 'Unpaid'
	paymentStatusVietnamese: string; // 'Đã thanh toán' or 'Chưa thanh toán'
}

/**
 * Zod schema for validating equipment rental contract view data
 */
export const equipmentRentalContractViewDataSchema = z.object({
	contractNumber: z.string().min(1),
	eventName: z.string(), // Can be empty for standalone equipment rental contracts (no event)
	companyName: z.string().min(1),
	companyNameVietnamese: z.string().min(1),
	companyAddressLine1: z.string().min(1),
	companyAddressLine2: z.string().min(1),
	companyWard: z.string().min(1),
	companyCity: z.string().min(1),
	companyTaxCode: z.string().min(1),
	companyRepresentative: z.string().min(1),
	companyRepresentativePhone: z.string().min(1),
	companyRepresentativeEmail: z.string().email(),
	counterpartyName: z.string().min(1),
	counterpartyNameVietnamese: z.string().min(1),
	rentalStartDate: z.string().min(1),
	rentalStartDateVietnamese: z.string().min(1),
	rentalStartDateEnglish: z.string().min(1),
	rentalEndDate: z.string().min(1),
	rentalEndDateVietnamese: z.string().min(1),
	rentalEndDateEnglish: z.string().min(1),
	equipment: z.array(
		z.object({
			name: z.string().min(1),
			quantity: z.number().min(1),
			unitPrice: z.string().min(1),
			totalPrice: z.string().min(1),
			serialNumbers: z.string()
		})
	),
	equipmentCount: z.number().min(1),
	totalEquipmentValue: z.string().min(1),
	securityDeposit: z.string().min(1),
	damageWaiver: z.enum(['Yes', 'No']),
	damageWaiverVietnamese: z.enum(['Có', 'Không']),
	venueName: z.string(), // Can be empty for legacy contracts
	venueNameEnglish: z.string(), // Can be empty for legacy contracts
	deliveryFee: z.string().min(1),
	venueAddress: z.string(), // Can be empty for legacy contracts
	venueAddressEnglish: z.string(), // Can be empty for legacy contracts
	contractValue: z.string().min(1),
	totalContractValue: z.string().min(1),
	currency: z.string().min(1),
	paymentDirection: z.enum(['Receivable', 'Payable']),
	paymentDirectionVietnamese: z.enum(['Phải thu', 'Phải trả']),
	paymentStatus: z.enum(['Paid', 'Unpaid']),
	paymentStatusVietnamese: z.enum(['Đã thanh toán', 'Chưa thanh toán'])
});

/**
 * Transform equipment rental contract data for view/preview
 * This performs all calculations, formatting, and translations
 * Normalizes null values to empty strings or 'N/A' for consistent display
 */
export async function transformEquipmentRentalContractData(
	contract: EquipmentRentalContract
): Promise<EquipmentRentalContractViewData> {
	// Format dates
	const rentalStartDateVietnamese = formatDateVietnamese(contract.rentalStartDate);
	const rentalStartDateEnglish = formatDateEnglish(contract.rentalStartDate);
	const rentalEndDateVietnamese = formatDateVietnamese(contract.rentalEndDate);
	const rentalEndDateEnglish = formatDateEnglish(contract.rentalEndDate);

	// Format equipment list
	const equipmentList = contract.equipment.map((item) => {
		const totalPrice = item.quantity * item.unitPrice;
		const serialNumbersText =
			item.serialNumbers.length > 0 ? item.serialNumbers.join(', ') : 'N/A';

		return {
			name: item.name,
			quantity: item.quantity,
			unitPrice: formatCurrency(item.unitPrice),
			totalPrice: formatCurrency(totalPrice),
			serialNumbers: serialNumbersText
		};
	});

	// Calculate totals
	const totalEquipmentValue = contract.equipment.reduce(
		(sum, item) => sum + item.quantity * item.unitPrice,
		0
	);
	// Total contract value is monthlyRent × months (already stored in contract.contractValue)
	const totalContractValue = contract.contractValue;

	// Note: Counterparty name is a proper noun — NOT translated

	// Format currency values
	const deliveryFeeFormatted = formatCurrency(contract.deliveryFee);
	const contractValueFormatted = formatCurrency(contract.contractValue);
	const securityDepositFormatted = formatCurrency(contract.securityDeposit);
	const totalContractValueFormatted = formatCurrency(totalContractValue);
	const totalEquipmentValueFormatted = formatCurrency(totalEquipmentValue);

	const result: EquipmentRentalContractViewData = {
		contractNumber: contract.contractNumber ?? "",
		eventName: contract.eventName ?? "", // Empty string if no event (standalone contract)
		companyName: companyConfig.name,
		companyNameVietnamese: companyConfig.nameVietnamese,
		companyAddressLine1: companyConfig.addressLine1,
		companyAddressLine2: companyConfig.addressLine2,
		companyWard: companyConfig.ward,
		companyCity: companyConfig.city,
		companyTaxCode: companyConfig.taxCode,
		companyRepresentative: companyConfig.representative,
		companyRepresentativePhone: companyConfig.representativePhone,
		companyRepresentativeEmail: companyConfig.representativeEmail,
		counterpartyName: contract.counterpartyName,
		counterpartyNameVietnamese: contract.counterpartyName,
		rentalStartDate: contract.rentalStartDate,
		rentalStartDateVietnamese: rentalStartDateVietnamese,
		rentalStartDateEnglish: rentalStartDateEnglish,
		rentalEndDate: contract.rentalEndDate,
		rentalEndDateVietnamese: rentalEndDateVietnamese,
		rentalEndDateEnglish: rentalEndDateEnglish,
		equipment: equipmentList,
		equipmentCount: contract.equipment.length,
		totalEquipmentValue: totalEquipmentValueFormatted,
		securityDeposit: securityDepositFormatted,
		damageWaiver: contract.damageWaiver ? 'Yes' : 'No',
		damageWaiverVietnamese: contract.damageWaiver ? 'Có' : 'Không',
		venueName: contract.venueName,
		venueNameEnglish: contract.venueNameEnglish,
		deliveryFee: deliveryFeeFormatted,
		venueAddress: contract.venueAddress,
		venueAddressEnglish: contract.venueAddressEnglish,
		contractValue: contractValueFormatted,
		totalContractValue: totalContractValueFormatted,
		currency: contract.currency,
		paymentDirection: contract.paymentDirection === 'receivable' ? 'Receivable' : 'Payable',
		paymentDirectionVietnamese:
			contract.paymentDirection === 'receivable' ? 'Phải thu' : 'Phải trả',
		paymentStatus: contract.paymentStatus === 'paid' ? 'Paid' : 'Unpaid',
		paymentStatusVietnamese: contract.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'
	};

	// Validate transformed data
	return equipmentRentalContractViewDataSchema.parse(result);
}