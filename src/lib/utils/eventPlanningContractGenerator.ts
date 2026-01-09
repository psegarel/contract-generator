import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import type { EventPlanningContractData } from '../schemas/eventPlanningContract';
import { companyConfig } from '../config/company';
import { translateToVietnamese } from './translate';
import { formatCurrency, formatDateVietnamese, formatDateEnglish } from './formatting';
import { generateContractNumber } from './contractHelpers';

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
		const contractNumber = generateContractNumber(data.clientCompany, 3);

		// ===== TRANSLATE ENGLISH FIELDS TO VIETNAMESE =====
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
		] = await Promise.all([
			translateToVietnamese(data.clientCompany),
			translateToVietnamese(data.clientAddress),
			translateToVietnamese(data.contractLocation),
			translateToVietnamese(data.clientRepresentativePosition),
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
			clientRepresentativePositionVietnamese: clientRepresentativePositionVN,
			clientRepresentativePositionEnglish: data.clientRepresentativePosition,

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
