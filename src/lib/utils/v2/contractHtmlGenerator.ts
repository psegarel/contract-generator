import mammoth from 'mammoth';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import DOMPurify from 'dompurify';
import type {
	ServiceProvisionContract,
	EventPlanningContract,
	EquipmentRentalContract
} from '$lib/types/v2/contracts';
import {
	transformServiceProvisionContractData,
	transformEventPlanningContractData,
	transformEquipmentRentalContractData
} from './contractDataTransformers';
import { companyConfig } from '$lib/config/company';
import { translateToVietnamese } from '../translate';
import { formatCurrency, formatDateVietnamese, formatDateEnglish } from '../formatting';
import { logger } from '../logger';
import { getCounterpartyById } from './counterparties';
import {
	numberToVietnameseWords,
	numberToEnglishWords,
	daysToVietnameseWords,
	daysToEnglishWords
} from '../numberToWords';

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
		logger.error('Error generating service provision contract HTML:', error);
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
		logger.error('Error generating event planning contract HTML:', error);
		throw error;
	}
}

/**
 * Generate HTML preview from equipment rental contract
 * Uses the same rendering logic as the document generator but outputs HTML
 */
export async function generateEquipmentRentalContractHtml(
	contract: EquipmentRentalContract
): Promise<string> {
	try {
		// Stage 3: Template Loading
		logger.info('[Stage 3] Starting HTML generation for contract', {
			contractId: contract.id,
			contractNumber: contract.contractNumber,
			equipmentCount: contract.equipment?.length || 0
		});

		// Stage 3: Template Loading
		logger.info('[Stage 3] Fetching template file: /_aVEquipmentRentalTemplate.docx');
		const response = await fetch('/_aVEquipmentRentalTemplate.docx');
		if (!response.ok) {
			logger.error('[Stage 3] Template fetch failed', { status: response.status, statusText: response.statusText });
			throw new Error(`Failed to load template: ${response.statusText}`);
		}
		const templateArrayBuffer = await response.arrayBuffer();
		logger.info('[Stage 3] Template loaded', { size: templateArrayBuffer.byteLength, sizeKB: Math.round(templateArrayBuffer.byteLength / 1024) });
		if (templateArrayBuffer.byteLength === 0) {
			logger.error('[Stage 3] Template file is empty');
			throw new Error('Template file is empty');
		}

		const zip = new PizZip(templateArrayBuffer);
		
		// Stage 6: Template Parsing
		logger.info('[Stage 6] Initializing Docxtemplater');
		let doc: Docxtemplater;
		try {
			doc = new Docxtemplater(zip, {
				paragraphLoop: true,
				linebreaks: true,
				delimiters: {
					start: '{{',
					end: '}}'
				}
			});
			logger.info('[Stage 6] Docxtemplater initialized successfully');
		} catch (error: any) {
			// If initialization fails, log detailed error
			logger.error('[Stage 6] Docxtemplater initialization failed');
			if (error.properties?.errors) {
				const errors = error.properties.errors;
				logger.error(`[Stage 6] Template has ${errors.length} errors`);
				
				// Group errors by type
				const splitPlaceholders = new Set<string>();
				const errorTypes = new Map<string, number>();
				
				errors.forEach((err: any) => {
					const errorType = err.id || 'unknown';
					errorTypes.set(errorType, (errorTypes.get(errorType) || 0) + 1);
					
					if (err.id === 'duplicate_open_tag' || err.id === 'duplicate_close_tag') {
						const xtag = err.properties?.xtag || '';
						if (xtag.startsWith('{{')) {
							splitPlaceholders.add(xtag);
						} else if (xtag.endsWith('}}')) {
							splitPlaceholders.add(xtag);
						}
					}
					
					logger.error(`[Stage 6] Error: ${err.name} - ${err.message}`, {
						id: err.id,
						xtag: err.properties?.xtag,
						context: err.properties?.context,
						file: err.properties?.file,
						offset: err.properties?.offset
					});
				});

				logger.error('[Stage 6] Error summary', {
					totalErrors: errors.length,
					errorTypes: Object.fromEntries(errorTypes),
					splitPlaceholders: Array.from(splitPlaceholders)
				});

				if (splitPlaceholders.size > 0) {
					throw new Error(`Template has ${errors.length} errors. Placeholders are split across XML nodes (likely due to formatting in Word). Split placeholders found: ${Array.from(splitPlaceholders).join(', ')}. To fix: 1) Open the template in Word, 2) Find each placeholder, 3) Select the ENTIRE placeholder (including {{ and }}), 4) Remove ALL formatting (bold/italic/underline), 5) If still broken, delete and retype as one continuous string.`);
				}
				
				throw new Error(`Template parsing failed with ${errors.length} errors. Check that all placeholders are unbroken (not split by formatting).`);
			}
			throw new Error(`Template parsing failed: ${error.message}. Check that all placeholders are unbroken (not split by formatting).`);
		}

		// Helper functions (same as document generator)

		// Parse address helper
		function parseAddress(address: string | null): { line1: string; line2: string; city: string } {
			if (!address) return { line1: '', line2: '', city: '' };
			const parts = address.split(',').map((p) => p.trim());
			if (parts.length >= 3) {
				return {
					line1: parts[0] || '',
					line2: parts.slice(1, -1).join(', ') || '',
					city: parts[parts.length - 1] || ''
				};
			} else if (parts.length === 2) {
				return { line1: parts[0] || '', line2: '', city: parts[1] || '' };
			}
			return { line1: address, line2: '', city: '' };
		}

		// Extract bank branch
		function extractBankBranch(bankName: string | null): string {
			if (!bankName) return '';
			const match = bankName.match(/-?\s*(CN\s+[^-]+|Branch\s+[^-]+)/i);
			return match ? match[1].trim() : '';
		}

		// Format equipment list
		function formatEquipmentListText(equipment: typeof contract.equipment): string {
			return equipment
				.map((item, index) => {
					const serials = item.serialNumbers.length > 0 ? ` (SN: ${item.serialNumbers.join(', ')})` : '';
					return `${index + 1}. ${item.quantity} x ${item.name}${serials}`;
				})
				.join('\n');
		}

		// Monthly rent is a user-entered value (not derived from equipment value)
		const monthlyRent = contract.monthlyRent || 0;


		// Stage 4: Counterparty Fetch
		logger.info('[Stage 4] Fetching counterparty data', { counterpartyId: contract.counterpartyId });
		const counterparty = contract.counterpartyId ? await getCounterpartyById(contract.counterpartyId) : null;
		
		if (!counterparty) {
			logger.warn('[Stage 4] Counterparty not found', { counterpartyId: contract.counterpartyId });
		} else {
			logger.info('[Stage 4] Counterparty fetched', {
				id: counterparty.id,
				type: counterparty.type,
				name: counterparty.name,
				hasCompanyName: !!(counterparty as any).companyName,
				hasAddress: !!counterparty.address,
				hasEmail: !!counterparty.email,
				hasPhone: !!counterparty.phone
			});
		}
		
		const clientCounterparty = counterparty?.type === 'client' ? (counterparty as any) : null;
		if (clientCounterparty) {
			logger.info('[Stage 4] Client counterparty details', {
				companyName: clientCounterparty.companyName,
				taxId: clientCounterparty.taxId,
				bankName: clientCounterparty.bankName,
				bankAccountNumber: clientCounterparty.bankAccountNumber,
				representativeName: clientCounterparty.representativeName
			});
		}

		// Parse addresses
		const partyBAddress = parseAddress(counterparty?.address || null);
		const partyBBankBranch = extractBankBranch(clientCounterparty?.bankName || '');

		// Translate counterparty fields
		// Note: Company names should NOT be translated - they remain the same in both languages
		const counterpartyAddressVN = counterparty?.address
			? await translateToVietnamese(counterparty.address)
			: '';

		// Ensure venue fields are always strings (never undefined)
		const venueName = contract.venueName || '';
		const venueNameEnglish = contract.venueNameEnglish || '';
		const venueAddress = contract.venueAddress || '';
		const venueAddressEnglish = contract.venueAddressEnglish || '';

		// Stage 5: Data Transformation
		logger.info('[Stage 5] Starting data transformation');
		logger.info('[Stage 5] Contract data before transformation', {
			equipmentCount: contract.equipment.length,
			equipmentItems: contract.equipment.map(e => ({ name: e.name, quantity: e.quantity })),
			totalEquipmentValue: contract.equipment.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
			deliveryFee: contract.deliveryFee,
			securityDeposit: contract.securityDeposit,
			contractValue: contract.contractValue
		});
		
		const viewData = await transformEquipmentRentalContractData(contract);
		
		logger.info('[Stage 5] Data transformation complete', {
			contractNumber: viewData.contractNumber,
			counterpartyName: viewData.counterpartyName,
			equipmentCount: viewData.equipmentCount,
			totalEquipmentValue: viewData.totalEquipmentValue,
			contractValue: viewData.contractValue
		});

		// Compute totals
		const totalEquipmentValue = contract.equipment.reduce(
			(sum, item) => sum + item.quantity * item.unitPrice, 0
		);

		// Number to words
		const monthlyRentInWordsVN = numberToVietnameseWords(monthlyRent) + ' đồng';
		const monthlyRentInWordsEN = numberToEnglishWords(monthlyRent) + ' VND';
		const depositInWordsVN = numberToVietnameseWords(contract.securityDeposit) + ' đồng';
		const depositInWordsEN = numberToEnglishWords(contract.securityDeposit) + ' VND';

		// Format dates
		const contractDateVietnamese = formatDateVietnamese(contract.rentalStartDate);
		const contractDateEnglish = formatDateEnglish(contract.rentalStartDate);

		// Format equipment list
		const equipmentListText = formatEquipmentListText(contract.equipment);

		// Stage 7: Template Rendering
		logger.info('[Stage 7] Preparing render data');
		
		// Calculate values for logging
		const renderDataKeys = [
			'contractNumber', 'contractDateVietnamese', 'contractDateEnglish',
			'partyACompanyVietnamese', 'partyACompanyEnglish',
			'partyBCompanyVietnamese', 'partyBCompanyEnglish',
			'rentalStartDateVietnamese', 'rentalEndDateVietnamese',
			'monthlyRentVND', 'depositVND',
			'equipmentList'
		];
		
		logger.info('[Stage 7] Render data summary', {
			placeholderCount: renderDataKeys.length,
			contractNumber: viewData.contractNumber,
			hasPartyBData: !!(clientCounterparty || counterparty),
			equipmentListLength: equipmentListText.length
		});
		
		logger.info('[Stage 7] Calling doc.render()');
		try {
			doc.render({
			// Contract Information
			contractNumber: viewData.contractNumber,
			contractDateVietnamese: contractDateVietnamese,
			contractDateEnglish: contractDateEnglish,

			// Party A (Insense) Information
			partyACompanyVietnamese: companyConfig.nameVietnamese,
			partyACompanyEnglish: companyConfig.name,
			partyARepresentative: companyConfig.representative,
			partyAEmail: companyConfig.representativeEmail,
			partyAPhone: companyConfig.representativePhone,
			partyAAddressLine1: companyConfig.addressLine1,
			partyAAddressLine2: companyConfig.addressLine2,
			companyWard: companyConfig.ward || '',
			partyACity: companyConfig.city,
			partyATaxCode: companyConfig.taxCode,
			partyABankName: companyConfig.bankName || '',
			partyAAccountNumber: companyConfig.bankAccountNumber || '',

			// Party B Information - use counterparty data directly
			// Company name should be the same in both languages (not translated)
			partyBCompanyVietnamese: clientCounterparty?.companyName || contract.counterpartyName,
			partyBCompanyEnglish: clientCounterparty?.companyName || contract.counterpartyName,
			partyBAddressLine1: partyBAddress.line1,
			partyBAddressLine2: partyBAddress.line2,
			partyBCity: partyBAddress.city,
			partyBAddressVietnamese: counterpartyAddressVN || '',
			partyBAddressEnglish: counterparty?.address || '',
			partyBTaxCode: clientCounterparty?.taxId || '',
			partyBAccountNumber: clientCounterparty?.bankAccountNumber || '',
			partyBBankName: clientCounterparty?.bankName || '',
			partyBBankBranch: partyBBankBranch,
			partyBRepresentative: clientCounterparty?.representativeName || '',
			partyBPosition: clientCounterparty?.representativePosition || '',
			partyBEmail: counterparty?.email || '',
			partyBPhone: counterparty?.phone || '',

			// Venue Information
			venueName,
			venueNameEnglish,
			venueAddress,
			venueAddressEnglish,

			// Rental Period
			rentalStartDateVietnamese: viewData.rentalStartDateVietnamese,
			rentalStartDateEnglish: viewData.rentalStartDateEnglish,
			rentalEndDateVietnamese: viewData.rentalEndDateVietnamese,
			rentalEndDateEnglish: viewData.rentalEndDateEnglish,

			// Financial Terms
			monthlyRentVND: formatCurrency(monthlyRent),
			monthlyRentInWords: monthlyRentInWordsVN,
			monthlyRentInWordsEnglish: monthlyRentInWordsEN,
			depositVND: formatCurrency(contract.securityDeposit),
			depositInWords: depositInWordsVN,
			depositInWordsEnglish: depositInWordsEN,

			// Residual Value (total equipment value)
			residualValueAmount: formatCurrency(totalEquipmentValue),
			residualValueCurrency: 'VND',
			residualValueInWords: numberToVietnameseWords(totalEquipmentValue) + ' đồng',
			residualValueInWordsEnglish: numberToEnglishWords(totalEquipmentValue) + ' VND',

			// Termination Terms (default 30 days)
			terminationNoticeDays: 30,
			terminationNoticeDaysInWords: daysToVietnameseWords(30),
			terminationNoticeDaysInWordsEnglish: daysToEnglishWords(30),

			// Equipment
			equipmentList: equipmentListText
			});
			logger.info('[Stage 7] Template rendered successfully');
		} catch (renderError: any) {
			logger.error('[Stage 7] Template rendering failed');
			// Log detailed render errors
			if (renderError.properties?.errors) {
				const errors = renderError.properties.errors;
				logger.error(`[Stage 7] Render has ${errors.length} errors`);
				errors.forEach((err: any) => {
					logger.error(`[Stage 7] Render error: ${err.name} - ${err.message}`, {
						id: err.id,
						xtag: err.properties?.xtag,
						context: err.properties?.context,
						file: err.properties?.file
					});
				});
			}
			throw new Error(`Template rendering failed: ${renderError.message}. The error "Duplicate open tag" for {{contractNumber}} usually means the placeholder in the footer is split by formatting. To fix: 1) Go to the footer, 2) Select the entire {{contractNumber}} placeholder (including {{ and }}), 3) Remove any formatting (bold/italic), 4) If it's still split, delete it and retype it as one continuous string.`);
		}

		// Generate the rendered DOCX as an array buffer
		logger.info('[Stage 7] Generating DOCX array buffer');
		const docxArrayBuffer = doc.getZip().generate({
			type: 'arraybuffer'
		});
		logger.info('[Stage 7] DOCX generated', { size: docxArrayBuffer.byteLength, sizeKB: Math.round(docxArrayBuffer.byteLength / 1024) });

		// Convert DOCX to HTML using mammoth
		logger.info('[Stage 7] Converting DOCX to HTML using mammoth');
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
		logger.info('[Stage 7] DOCX converted to HTML', { htmlLength: result.value.length });

		// Sanitize HTML to prevent XSS attacks
		logger.info('[Stage 7] Sanitizing HTML');
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

		logger.info('[Stage 7] HTML generation complete', { htmlLength: sanitizedHtml.length });
		return sanitizedHtml;
	} catch (error) {
		logger.error('[FATAL] Error generating equipment rental contract HTML:', error);
		if (error instanceof Error) {
			logger.error('[FATAL] Error details', {
				message: error.message,
				stack: error.stack
			});
		}
		throw error;
	}
}
