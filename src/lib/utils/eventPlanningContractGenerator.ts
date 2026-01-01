import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import type { EventPlanningContractData } from '../schemas/eventPlanningContract';
import { companyConfig } from '../config/company';
import { translateToVietnamese } from './translate';

/**
 * Format a date to Vietnamese format
 * Example: "2025-08-16" → "16 tháng 8 năm 2025"
 */
function formatDateVietnamese(dateString: string): string {
	const date = new Date(dateString);
	const day = date.getDate();
	const month = date.getMonth() + 1;
	const year = date.getFullYear();
	return `${day} tháng ${month} năm ${year}`;
}

/**
 * Format a date to English format
 * Example: "2025-08-16" → "16 August 2025"
 */
function formatDateEnglish(dateString: string): string {
	const date = new Date(dateString);
	const day = date.getDate();
	const month = date.toLocaleString('en-US', { month: 'long' });
	const year = date.getFullYear();
	return `${day} ${month} ${year}`;
}

/**
 * Format currency in Vietnamese locale
 */
function formatCurrency(amount: number): string {
	return new Intl.NumberFormat('vi-VN').format(amount);
}

/**
 * Generate event planning contract document from form data
 */
export const generateEventPlanningContract = async (
	data: EventPlanningContractData
): Promise<Blob> => {
	try {
		// Load the event planning contract template
		const response = await fetch('/event-planning-services-template.docx');
		if (!response.ok) {
			throw new Error(`Failed to load template: ${response.statusText}`);
		}
		const templateArrayBuffer = await response.arrayBuffer();
		if (templateArrayBuffer.byteLength === 0) {
			throw new Error('Template file is empty');
		}

		const zip = new PizZip(templateArrayBuffer);
		const doc = new Docxtemplater(zip, {
			paragraphLoop: true,
			linebreaks: true
		});

		// ===== GENERATE CONTRACT NUMBER =====
		const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
		const initials = data.clientCompany
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 3); // Limit to 3 characters
		const timestamp = Date.now().toString().slice(-3);
		const contractNumber = `${dateStr}-${initials}-${timestamp}`;

		// ===== TRANSLATE ENGLISH FIELDS TO VIETNAMESE =====
		const [
			clientCompanyVN,
			clientAddressVN,
			contractLocationVN,
			clientNationalityVN,
			clientPassportIssuedPlaceVN,
			clientRepresentativePositionVN,
			clientAuthorityVN,
			eventThemeVN,
			eventTypeVN,
			eventDescriptionVN,
			eventVenueVN,
			eventDurationVN,
			arbitrationLocationVN
		] = await Promise.all([
			translateToVietnamese(data.clientCompany),
			translateToVietnamese(data.clientAddress),
			translateToVietnamese(data.contractLocation),
			translateToVietnamese(data.clientNationality),
			translateToVietnamese(data.clientPassportIssuedPlace),
			translateToVietnamese(data.clientRepresentativePosition),
			translateToVietnamese(data.clientAuthority),
			data.eventTheme ? translateToVietnamese(data.eventTheme) : Promise.resolve(''),
			data.eventType ? translateToVietnamese(data.eventType) : Promise.resolve(''),
			data.eventDescription ? translateToVietnamese(data.eventDescription) : Promise.resolve(''),
			translateToVietnamese(data.eventVenue),
			data.eventDuration ? translateToVietnamese(data.eventDuration) : Promise.resolve(''),
			translateToVietnamese(data.arbitrationLocation)
		]);

		// ===== FORMAT DATES =====
		const contractDateVietnamese = formatDateVietnamese(data.contractDate);
		const contractDateEnglish = formatDateEnglish(data.contractDate);
		const eventDateVietnamese = formatDateVietnamese(data.eventDate);
		const eventDateEnglish = formatDateEnglish(data.eventDate);

		// ===== RENDER DOCUMENT WITH ALL PLACEHOLDERS =====
		doc.render({
			// Contract Information
			contractNumber,
			contractDateVietnamese,
			contractDateEnglish,
			contractLocationVietnamese: contractLocationVN,
			contractLocationEnglish: data.contractLocation,

			// Client Information (Party A)
			clientCompanyVietnamese: clientCompanyVN,
			clientCompanyEnglish: data.clientCompany,
			clientAddressVietnamese: clientAddressVN,
			clientAddressEnglish: data.clientAddress,
			clientTaxCode: data.clientTaxCode,
			clientRepresentativeName: data.clientRepresentativeName,
			clientNationalityVietnamese: clientNationalityVN,
			clientNationalityEnglish: data.clientNationality,
			clientPassportNumber: data.clientPassportNumber,
			clientPassportIssuedDate: data.clientPassportIssuedDate,
			clientPassportIssuedPlaceVietnamese: clientPassportIssuedPlaceVN,
			clientPassportIssuedPlaceEnglish: data.clientPassportIssuedPlace,
			clientRepresentativePositionVietnamese: clientRepresentativePositionVN,
			clientRepresentativePositionEnglish: data.clientRepresentativePosition,
			clientAuthorityVietnamese: clientAuthorityVN,
			clientAuthorityEnglish: data.clientAuthority,

			// Event Information
			eventThemeVietnamese: eventThemeVN,
			eventThemeEnglish: data.eventTheme || '',
			eventName: data.eventName,
			eventTypeVietnamese: eventTypeVN,
			eventTypeEnglish: data.eventType || '',
			eventDescriptionVietnamese: eventDescriptionVN,
			eventDescriptionEnglish: data.eventDescription || '',
			eventVenueVietnamese: eventVenueVN,
			eventVenueEnglish: data.eventVenue,
			eventDateVietnamese,
			eventDateEnglish,
			eventDurationVietnamese: eventDurationVN,
			eventDurationEnglish: data.eventDuration || '',
			expectedAttendance: data.expectedAttendance || '',

			// Financial Terms
			contractValueVND: formatCurrency(data.contractValueVND),
			vatRate: `${data.vatRate}%`,
			depositPercentage: `${data.depositPercentage}%`,
			finalPaymentPercentage: `${data.finalPaymentPercentage}%`,
			professionalIndemnityAmount: formatCurrency(data.professionalIndemnityAmount),
			publicLiabilityAmount: formatCurrency(data.publicLiabilityAmount),

			// Timeline
			planningMeetingDays: data.planningMeetingDays,
			performerBookingDeadline: data.performerBookingDeadline,
			technicalSetupDate: data.technicalSetupDate,
			eventExecutionDate: data.eventExecutionDate,
			setupCommencementTime: data.setupCommencementTime,
			eventExecutionDuration: data.eventExecutionDuration,
			breakdownCompletionDateTime: data.breakdownCompletionDateTime,

			// Legal Terms
			paymentGracePeriodDays: data.paymentGracePeriodDays,
			terminationNoticeDays: data.terminationNoticeDays,
			negotiationPeriodDays: data.negotiationPeriodDays,
			arbitrationLocationVietnamese: arbitrationLocationVN,
			arbitrationLocationEnglish: data.arbitrationLocation,
			arbitrationLanguage: data.arbitrationLanguage
		});

		const blob = doc.getZip().generate({
			type: 'blob',
			mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
		});

		return blob;
	} catch (error) {
		console.error('Event Planning Generator Error:', error);
		throw error;
	}
};
