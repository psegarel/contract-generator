import mammoth from 'mammoth';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import DOMPurify from 'dompurify';
import type { ServiceProvisionContract, EventPlanningContract } from '$lib/types/v2/contracts';
import {
	transformServiceProvisionContractData,
	transformEventPlanningContractData
} from './contractDataTransformers';
import { companyConfig } from '$lib/config/company';
import { translateToVietnamese } from '../translate';
import { formatCurrency, formatDateVietnamese, formatDateEnglish } from '../formatting';

/**
 * Generate HTML preview from service provision contract
 * Uses the same rendering logic as the document generator but outputs HTML
 */
export async function generateServiceProvisionContractHtml(
	contract: ServiceProvisionContract
): Promise<string> {
	try {
		// Load the service contract template
		const response = await fetch('/service-contract-template.docx');
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

		// Use transformer to get all formatted data (includes translations)
		const viewData = await transformServiceProvisionContractData(contract);

		// Render the document with the same data structure as the generator
		doc.render({
			contractNumber: viewData.contractNumber,
			companyName: viewData.companyName,
			companyAddressLine1: viewData.companyAddressLine1,
			companyAddressLine2: viewData.companyAddressLine2,
			companyWard: viewData.companyWard,
			companyCity: viewData.companyCity,
			companyTaxCode: viewData.companyTaxCode,
			companyRepresentative: viewData.companyRepresentative,
			companyFunction: viewData.companyFunction,
			companyRepresentativePhone: viewData.companyRepresentativePhone,
			companyRepresentativeEmail: viewData.companyRepresentativeEmail,
			clientName: viewData.clientName,
			clientEmail: viewData.clientEmail,
			clientAddress: viewData.clientAddress,
			clientPhone: viewData.clientPhone,
			clientIdDocument: viewData.clientIdDocument,
			clientTaxId: viewData.clientTaxId,
			bankName: viewData.bankName,
			accountNumber: viewData.accountNumber,
			jobName: viewData.jobName,
			jobNameVN: viewData.jobNameVN,
			eventName: viewData.eventName,
			numberOfPerformances: viewData.numberOfPerformances,
			eventLocation: viewData.eventLocation,
			firstPerformanceTime: viewData.firstPerformanceTime,
			jobContent: viewData.jobContent,
			jobContentVN: viewData.jobContentVN,
			netFee: viewData.netFee,
			taxRate: viewData.taxRate,
			taxAmount: viewData.taxAmount,
			grossFee: viewData.grossFee,
			startDate: viewData.startDate,
			endDate: viewData.endDate
		});

		// Generate the rendered DOCX as an array buffer
		const docxArrayBuffer = doc.getZip().generate({
			type: 'arraybuffer'
		});

		// Convert DOCX to HTML using mammoth
		const result = await mammoth.convertToHtml(
			{ arrayBuffer: docxArrayBuffer },
			{
				styleMap: [
					"p[style-name='Heading 1'] => h1:fresh",
					"p[style-name='Heading 2'] => h2:fresh",
					"p[style-name='Heading 3'] => h3:fresh"
				]
			}
		);

		// Sanitize HTML to prevent XSS attacks
		const sanitizedHtml = DOMPurify.sanitize(result.value, {
			USE_PROFILES: { html: true },
			ALLOWED_TAGS: [
				'p',
				'br',
				'strong',
				'b',
				'em',
				'i',
				'u',
				'h1',
				'h2',
				'h3',
				'h4',
				'h5',
				'h6',
				'ul',
				'ol',
				'li',
				'table',
				'tr',
				'td',
				'th',
				'tbody',
				'thead',
				'span',
				'div'
			],
			ALLOWED_ATTR: ['style', 'class', 'colspan', 'rowspan', 'align']
		});

		return sanitizedHtml;
	} catch (error) {
		console.error('Error generating service provision contract HTML:', error);
		throw error;
	}
}

/**
 * Generate HTML preview from event planning contract
 * Uses the same rendering logic as the document generator but outputs HTML
 */
export async function generateEventPlanningContractHtml(
	contract: EventPlanningContract
): Promise<string> {
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

		// Use transformer to get all formatted data (includes translations)
		const viewData = await transformEventPlanningContractData(contract);

		// Render the document with the same data structure as the generator
		doc.render({
			// Contract Information
			contractNumber: viewData.contractNumber,
			contractDateVietnamese: viewData.contractDateVietnamese,
			contractDateEnglish: viewData.contractDateEnglish,
			contractLocationVietnamese: viewData.contractLocationVietnamese,
			contractLocationEnglish: viewData.contractLocationEnglish,

			// Client Information (Party A)
			clientCompanyVietnamese: viewData.clientCompanyVietnamese,
			clientCompanyEnglish: viewData.clientCompanyEnglish,
			clientAddressVietnamese: viewData.clientAddressVietnamese,
			clientAddressEnglish: viewData.clientAddressEnglish,
			clientTaxCode: viewData.clientTaxCode,
			clientRepresentativeName: viewData.clientRepresentativeName,
			clientRepresentativePositionVietnamese: viewData.clientRepresentativePositionVietnamese,
			clientRepresentativePositionEnglish: viewData.clientRepresentativePositionEnglish,

			// Event Information
			eventThemeVietnamese: viewData.eventThemeVietnamese,
			eventThemeEnglish: viewData.eventThemeEnglish,
			eventName: viewData.eventName,
			eventTypeVietnamese: viewData.eventTypeVietnamese,
			eventTypeEnglish: viewData.eventTypeEnglish,
			eventDescriptionVietnamese: viewData.eventDescriptionVietnamese,
			eventDescriptionEnglish: viewData.eventDescriptionEnglish,
			eventVenueVietnamese: viewData.eventVenueVietnamese,
			eventVenueEnglish: viewData.eventVenueEnglish,
			eventDateVietnamese: viewData.eventDateVietnamese,
			eventDateEnglish: viewData.eventDateEnglish,
			eventDurationVietnamese: viewData.eventDurationVietnamese,
			eventDurationEnglish: viewData.eventDurationEnglish,
			expectedAttendance: viewData.expectedAttendance,

			// Financial Terms
			contractValueVND: viewData.contractValueVND,
			vatRate: viewData.vatRate,
			depositPercentage: viewData.depositPercentage,
			finalPaymentPercentage: viewData.finalPaymentPercentage,
			professionalIndemnityAmount: viewData.professionalIndemnityAmount,
			publicLiabilityAmount: viewData.publicLiabilityAmount,

			// Timeline
			planningMeetingDays: viewData.planningMeetingDays,
			performerBookingDeadline: viewData.performerBookingDeadline,
			technicalSetupDate: viewData.technicalSetupDate,
			eventExecutionDate: viewData.eventExecutionDate,
			setupCommencementTime: viewData.setupCommencementTime,
			eventExecutionDuration: viewData.eventExecutionDuration,
			breakdownCompletionDateTime: viewData.breakdownCompletionDateTime,

			// Legal Terms
			paymentGracePeriodDays: viewData.paymentGracePeriodDays,
			terminationNoticeDays: viewData.terminationNoticeDays,
			negotiationPeriodDays: viewData.negotiationPeriodDays,
			arbitrationLocationVietnamese: viewData.arbitrationLocationVietnamese,
			arbitrationLocationEnglish: viewData.arbitrationLocationEnglish,
			arbitrationLanguage: viewData.arbitrationLanguage
		});

		// Generate the rendered DOCX as an array buffer
		const docxArrayBuffer = doc.getZip().generate({
			type: 'arraybuffer'
		});

		// Convert DOCX to HTML using mammoth
		const result = await mammoth.convertToHtml(
			{ arrayBuffer: docxArrayBuffer },
			{
				styleMap: [
					"p[style-name='Heading 1'] => h1:fresh",
					"p[style-name='Heading 2'] => h2:fresh",
					"p[style-name='Heading 3'] => h3:fresh"
				]
			}
		);

		// Sanitize HTML to prevent XSS attacks
		const sanitizedHtml = DOMPurify.sanitize(result.value, {
			USE_PROFILES: { html: true },
			ALLOWED_TAGS: [
				'p',
				'br',
				'strong',
				'b',
				'em',
				'i',
				'u',
				'h1',
				'h2',
				'h3',
				'h4',
				'h5',
				'h6',
				'ul',
				'ol',
				'li',
				'table',
				'tr',
				'td',
				'th',
				'tbody',
				'thead',
				'span',
				'div'
			],
			ALLOWED_ATTR: ['style', 'class', 'colspan', 'rowspan', 'align']
		});

		return sanitizedHtml;
	} catch (error) {
		console.error('Error generating event planning contract HTML:', error);
		throw error;
	}
}
