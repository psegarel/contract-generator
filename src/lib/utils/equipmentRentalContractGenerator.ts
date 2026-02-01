import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import type { EquipmentRentalContract } from '../types/v2';
import { companyConfig } from '../config/company';
import { translateToVietnamese } from './translate';
import { formatCurrency, formatDateVietnamese, formatDateEnglish } from './formatting';
import { logger } from './logger';
import { getCounterpartyById } from './v2/counterparties';
import {
	numberToVietnameseWords,
	numberToEnglishWords,
	daysToVietnameseWords,
	daysToEnglishWords
} from './numberToWords';

/**
 * Generate equipment rental contract document from contract data
 */
export const generateEquipmentRentalContract = async (
	contract: EquipmentRentalContract
): Promise<Blob> => {
	try {
		// Load the equipment rental contract template
		const response = await fetch('/_aVEquipmentRentalTemplate.docx');
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
		} catch (error: any) {
			// If initialization fails, log detailed error
			if (error.properties?.errors) {
				const errors = error.properties.errors;
				logger.error(`Template has ${errors.length} errors. Common issues:`);
				
				// Group errors by type
				const splitPlaceholders = new Set<string>();
				errors.forEach((err: any) => {
					if (err.id === 'duplicate_open_tag' || err.id === 'duplicate_close_tag') {
						const xtag = err.properties?.xtag || '';
						// Try to reconstruct the full placeholder name
						if (xtag.startsWith('{{')) {
							splitPlaceholders.add(xtag);
						} else if (xtag.endsWith('}}')) {
							splitPlaceholders.add(xtag);
						}
					}
				});

				if (splitPlaceholders.size > 0) {
					logger.error('Split placeholders detected:', Array.from(splitPlaceholders));
					throw new Error(`Template has ${errors.length} errors. Placeholders are split across XML nodes (likely due to formatting in Word). Split placeholders found: ${Array.from(splitPlaceholders).join(', ')}. To fix: 1) Open the template in Word, 2) Find each placeholder, 3) Select the ENTIRE placeholder (including {{ and }}), 4) Remove ALL formatting (bold/italic/underline), 5) If still broken, delete and retype as one continuous string.`);
				}
				
				throw new Error(`Template parsing failed with ${errors.length} errors. Check that all placeholders are unbroken (not split by formatting).`);
			}
			throw new Error(`Template parsing failed: ${error.message}. Check that all placeholders are unbroken (not split by formatting).`);
		}

		// ===== FORMAT DATES =====
		// Use rental start date as contract date
		const contractDateVietnamese = formatDateVietnamese(contract.rentalStartDate);
		const contractDateEnglish = formatDateEnglish(contract.rentalStartDate);
		const rentalStartDateVietnamese = formatDateVietnamese(contract.rentalStartDate);
		const rentalStartDateEnglish = formatDateEnglish(contract.rentalStartDate);
		const rentalEndDateVietnamese = formatDateVietnamese(contract.rentalEndDate);
		const rentalEndDateEnglish = formatDateEnglish(contract.rentalEndDate);

		// ===== FORMAT EQUIPMENT LIST =====
		// Format equipment items for display in template
		// Each item will have: name, quantity, unitPrice, totalPrice, serialNumbers
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
		const totalContractValue = totalEquipmentValue + contract.deliveryFee;

		// Monthly rent is a user-entered value (not derived from equipment value)
		const monthlyRent = contract.monthlyRent || 0;

		// ===== FETCH COUNTERPARTY DETAILS =====
		// Get full counterparty information for document generation
		const counterparty = contract.counterpartyId
			? await getCounterpartyById(contract.counterpartyId)
			: null;

		// ===== HELPER FUNCTIONS =====
		// Parse address into components
		function parseAddress(address: string | null): {
			line1: string;
			line2: string;
			city: string;
		} {
			if (!address) return { line1: '', line2: '', city: '' };

			// Try to split by common delimiters
			const parts = address.split(',').map((p) => p.trim());
			if (parts.length >= 3) {
				// Assume last part is city
				return {
					line1: parts[0] || '',
					line2: parts.slice(1, -1).join(', ') || '',
					city: parts[parts.length - 1] || ''
				};
			} else if (parts.length === 2) {
				return {
					line1: parts[0] || '',
					line2: '',
					city: parts[1] || ''
				};
			}
			return { line1: address, line2: '', city: '' };
		}

		// Extract bank branch from bank name (e.g., "ACB - CN Danang" -> "CN Danang")
		function extractBankBranch(bankName: string | null): string {
			if (!bankName) return '';
			const match = bankName.match(/-?\s*(CN\s+[^-]+|Branch\s+[^-]+)/i);
			return match ? match[1].trim() : '';
		}

		// Format equipment list as text
		function formatEquipmentListText(equipment: typeof contract.equipment): string {
			return equipment
				.map((item, index) => {
					const serials =
						item.serialNumbers.length > 0 ? ` (SN: ${item.serialNumbers.join(', ')})` : '';
					return `${index + 1}. ${item.quantity} x ${item.name}${serials}`;
				})
				.join('\n');
		}

		// ===== TRANSLATE FIELDS =====
		// Get client counterparty fields (type-safe)
		const clientCounterparty =
			counterparty?.type === 'client' ? (counterparty as any) : null;

		// Note: Company/counterparty names are proper nouns — NOT translated
		const counterpartyAddressVN = counterparty?.address
			? await translateToVietnamese(counterparty.address)
			: '';

		// Ensure venue fields are always strings (never undefined)
		const venueName = contract.venueName || '';
		const venueNameEnglish = contract.venueNameEnglish || '';
		const venueAddress = contract.venueAddress || '';
		const venueAddressEnglish = contract.venueAddressEnglish || '';

		// Parse addresses
		const partyBAddress = parseAddress(counterparty?.address || null);
		const partyBAddressVN = parseAddress(counterpartyAddressVN || null);

		// Extract bank branch
		const partyBBankBranch = extractBankBranch(clientCounterparty?.bankName || '');

		// Format equipment list
		const equipmentListText = formatEquipmentListText(contract.equipment);

		// Number to words conversions
		const monthlyRentInWordsVN = numberToVietnameseWords(monthlyRent) + ' đồng';
		const monthlyRentInWordsEN = numberToEnglishWords(monthlyRent) + ' VND';
		const depositInWordsVN = numberToVietnameseWords(contract.securityDeposit) + ' đồng';
		const depositInWordsEN = numberToEnglishWords(contract.securityDeposit) + ' VND';

		// ===== RENDER DOCUMENT WITH ALL PLACEHOLDERS =====
		try {
			doc.render({
			// Contract Information
			contractNumber: contract.contractNumber,
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

			// Party B Information
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
			rentalStartDateVietnamese: rentalStartDateVietnamese,
			rentalStartDateEnglish: rentalStartDateEnglish,
			rentalEndDateVietnamese: rentalEndDateVietnamese,
			rentalEndDateEnglish: rentalEndDateEnglish,

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

			// Termination Terms (not in current contract, set to default 30 days)
			terminationNoticeDays: 30,
			terminationNoticeDaysInWords: daysToVietnameseWords(30),
			terminationNoticeDaysInWordsEnglish: daysToEnglishWords(30),

			// Equipment
			equipmentList: equipmentListText
			});
		} catch (renderError: any) {
			// Log detailed render errors
			if (renderError.properties?.errors) {
				logger.error('Docxtemplater render errors:', renderError.properties.errors);
				renderError.properties.errors.forEach((err: any) => {
					logger.error(`Render error: ${err.name} - ${err.message}`, {
						xtag: err.properties?.xtag,
						context: err.properties?.context,
						file: err.properties?.file
					});
				});
			}
			throw new Error(`Template rendering failed: ${renderError.message}. The error "Duplicate open tag" for {{contractNumber}} usually means the placeholder in the footer is split by formatting. To fix: 1) Go to the footer, 2) Select the entire {{contractNumber}} placeholder (including {{ and }}), 3) Remove any formatting (bold/italic), 4) If it's still split, delete it and retype it as one continuous string.`);
		}

		const blob = doc.getZip().generate({
			type: 'blob',
			mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
		});

		return blob;
	} catch (error) {
		logger.error('Generator Error:', error);
		throw error;
	}
};
