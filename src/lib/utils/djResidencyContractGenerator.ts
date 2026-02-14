import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import type { DjResidencyContract, ClientCounterparty } from '../types/v2';
import { companyConfig } from '../config/company';
import { formatCurrency, formatDateVietnamese, formatDateEnglish } from './formatting';
import { logger } from './logger';
import { numberToVietnameseWords, numberToEnglishWords } from './numberToWords';

/**
 * Convert a small number (1-12) to Vietnamese words for months
 */
function smallNumberToVietnameseWords(num: number): string {
	const words = [
		'không',
		'một',
		'hai',
		'ba',
		'bốn',
		'năm',
		'sáu',
		'bảy',
		'tám',
		'chín',
		'mười',
		'mười một',
		'mười hai'
	];
	return words[num] || numberToVietnameseWords(num);
}

/**
 * Convert a small number (1-12) to English words
 */
function smallNumberToEnglishWords(num: number): string {
	const words = [
		'zero',
		'one',
		'two',
		'three',
		'four',
		'five',
		'six',
		'seven',
		'eight',
		'nine',
		'ten',
		'eleven',
		'twelve'
	];
	return words[num] || numberToEnglishWords(num);
}

/**
 * Format a number with leading zero if less than 10
 */
function formatNumberWithLeadingZero(num: number): string {
	return num < 10 ? `0${num}` : `${num}`;
}

/**
 * Generate DJ residency contract document from contract data and venue counterparty
 */
export const generateDjResidencyContract = async (
	contract: DjResidencyContract,
	venueCounterparty: ClientCounterparty
): Promise<Blob> => {
	try {
		// Load the DJ residency contract template
		const response = await fetch('/_djResidency.docx');
		if (!response.ok) {
			throw new Error(`Failed to load template: ${response.statusText}`);
		}
		const templateArrayBuffer = await response.arrayBuffer();
		if (templateArrayBuffer.byteLength === 0) {
			throw new Error('Template file is empty');
		}

		const zip = new PizZip(templateArrayBuffer);

		// Configure docxtemplater with error handling
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
		} catch (error: unknown) {
			const err = error as { properties?: { errors?: Array<{ id: string; properties?: { xtag?: string } }> }; message?: string };
			if (err.properties?.errors) {
				const errors = err.properties.errors;
				logger.error(`Template has ${errors.length} errors. Common issues:`);

				const splitPlaceholders = new Set<string>();
				errors.forEach((e) => {
					if (e.id === 'duplicate_open_tag' || e.id === 'duplicate_close_tag') {
						const xtag = e.properties?.xtag || '';
						if (xtag.startsWith('{{') || xtag.endsWith('}}')) {
							splitPlaceholders.add(xtag);
						}
					}
				});

				if (splitPlaceholders.size > 0) {
					logger.error('Split placeholders detected:', Array.from(splitPlaceholders));
					throw new Error(
						`Template has ${errors.length} errors. Placeholders are split across XML nodes. Split placeholders found: ${Array.from(splitPlaceholders).join(', ')}.`
					);
				}

				throw new Error(
					`Template parsing failed with ${errors.length} errors. Check that all placeholders are unbroken.`
				);
			}
			throw new Error(
				`Template parsing failed: ${err.message}. Check that all placeholders are unbroken.`
			);
		}

		// ===== FORMAT DATES =====
		const contractDateVietnamese = formatDateVietnamese(contract.contractStartDate);
		const contractDateEnglish = formatDateEnglish(contract.contractStartDate);

		// ===== FORMAT NUMBERS =====
		// Contract duration
		const contractDurationMonths = smallNumberToEnglishWords(contract.contractDurationMonths);
		const contractDurationMonthsVietnamese = smallNumberToVietnameseWords(
			contract.contractDurationMonths
		);
		const contractDurationMonthsNumber = formatNumberWithLeadingZero(
			contract.contractDurationMonths
		);

		// Performance hours
		const performanceHours = smallNumberToEnglishWords(contract.performanceHoursPerSet);
		const performanceHoursVietnamese = smallNumberToVietnameseWords(
			contract.performanceHoursPerSet
		);
		const performanceHoursNumber = contract.performanceHoursPerSet.toString();

		// Number of sets
		const numberOfSets = smallNumberToEnglishWords(contract.numberOfSetsPerDay);
		const numberOfSetsVietnamese = smallNumberToVietnameseWords(contract.numberOfSetsPerDay);
		const numberOfSetsNumber = contract.numberOfSetsPerDay.toString();

		// Performance fee
		const performanceFeeVND = formatCurrency(contract.performanceFeeVND);
		const performanceFeeInWords = numberToEnglishWords(contract.performanceFeeVND) + ' Vietnamese Dong';
		const performanceFeeInWordsVietnamese =
			numberToVietnameseWords(contract.performanceFeeVND) + ' đồng Việt Nam';

		// ===== DERIVE PARTY B VALUES FROM COUNTERPARTY =====
		const partyBCompanyName = venueCounterparty.companyName || venueCounterparty.name;
		const partyBAddress = venueCounterparty.address || '';

		// ===== RENDER DOCUMENT WITH ALL PLACEHOLDERS =====
		try {
			doc.render({
				// Contract Information
				contractNumber: contract.contractNumber,
				contractDateEnglish,
				contractDateVietnamese,

				// Party A (Insense) Information
				partyACompanyVietnamese: companyConfig.nameVietnamese,
				partyACompanyEnglish: companyConfig.name,
				partyAAddressLine1: companyConfig.addressLine1,
				partyAAddressLine2: companyConfig.addressLine2,
				companyWard: companyConfig.ward || '',
				partyACity: companyConfig.city,
				partyATaxCode: companyConfig.taxCode,
				partyABankName: companyConfig.bankName || '',
				partyAAccountNumber: companyConfig.bankAccountNumber || '',
				partyARepresentative: companyConfig.representative,
				partyARepresentativePosition: 'Director',
				partyAEmail: companyConfig.representativeEmail,
				partyAPhone: companyConfig.representativePhone,

				// Party B (Venue) Information - sourced from counterparty
				partyBCompanyVietnamese: partyBCompanyName,
				partyBCompanyEnglish: partyBCompanyName,
				partyBAddressLine1: partyBAddress,
				partyBAddressLine2: '',
				partyBCity: '',
				partyBTaxCode: venueCounterparty.taxId || '',
				partyBRepresentative: venueCounterparty.representativeName || '',
				partyBRepresentativePosition: venueCounterparty.representativePosition || '',

				// Service Terms
				contractDurationMonths,
				contractDurationMonthsVietnamese,
				contractDurationMonthsNumber,
				performanceDays: contract.performanceDays,
				performanceDaysVietnamese: contract.performanceDaysVietnamese,
				performanceHours,
				performanceHoursVietnamese,
				performanceHoursNumber,
				numberOfSets,
				numberOfSetsVietnamese,
				numberOfSetsNumber,

				// Payment Terms
				performanceFeeVND,
				performanceFeeInWords,
				performanceFeeInWordsVietnamese,

				// Termination Terms
				terminationNoticeDays: contract.terminationNoticeDays.toString()
			});
		} catch (renderError: unknown) {
			const err = renderError as { properties?: { errors?: Array<{ name: string; message: string; properties?: { xtag?: string; context?: string; file?: string } }> }; message?: string };
			if (err.properties?.errors) {
				logger.error('Docxtemplater render errors:', err.properties.errors);
				err.properties.errors.forEach((e) => {
					logger.error(`Render error: ${e.name} - ${e.message}`, {
						xtag: e.properties?.xtag,
						context: e.properties?.context,
						file: e.properties?.file
					});
				});
			}
			throw new Error(
				`Template rendering failed: ${err.message}. Check that all placeholders in the template match the expected format.`
			);
		}

		const blob = doc.getZip().generate({
			type: 'blob',
			mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
		});

		return blob;
	} catch (error) {
		logger.error('DJ Residency Generator Error:', error);
		throw error;
	}
};
