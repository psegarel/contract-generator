import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import type { EquipmentRentalOneOffContract } from '$lib/types/v2/contracts';
import { companyConfig } from '$lib/config/company';
import { formatCurrency, formatDateVietnamese, formatDateEnglish } from './formatting';
import { numberToVietnameseWords, numberToEnglishWords } from './numberToWords';
import { getCounterpartyById } from './v2/counterparties';
import type { ClientCounterparty } from '$lib/types/v2';
import { logger } from './logger';

/**
 * Format an ISO datetime-local string to a human-readable Vietnamese format
 * e.g., "2026-07-14T09:00" → "09:00 ngày 14 tháng 7 năm 2026"
 */
function formatDateTimeVietnamese(dateTimeStr: string): string {
	const date = new Date(dateTimeStr);
	const hours = date.getHours().toString().padStart(2, '0');
	const minutes = date.getMinutes().toString().padStart(2, '0');
	const day = date.getDate();
	const month = date.getMonth() + 1;
	const year = date.getFullYear();
	return `${hours}:${minutes} ngày ${day} tháng ${month} năm ${year}`;
}

/**
 * Format an ISO datetime-local string to a human-readable English format
 * e.g., "2026-07-14T09:00" → "09:00 on 14 July 2026"
 */
function formatDateTimeEnglish(dateTimeStr: string): string {
	const date = new Date(dateTimeStr);
	const hours = date.getHours().toString().padStart(2, '0');
	const minutes = date.getMinutes().toString().padStart(2, '0');
	const day = date.getDate();
	const month = date.toLocaleString('en-US', { month: 'long' });
	const year = date.getFullYear();
	return `${hours}:${minutes} on ${day} ${month} ${year}`;
}

/**
 * Generate a Word document for an equipment rental one-off contract
 */
export async function generateEquipmentRentalOneOffContract(
	contract: EquipmentRentalOneOffContract
): Promise<Blob> {
	const response = await fetch('/_equipmentRentalOneOffTemplate.docx');
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
		linebreaks: true,
		delimiters: {
			start: '{{',
			end: '}}'
		},
		// Replace missing/undefined placeholders with empty string instead of "undefined"
		nullGetter() {
			return '';
		}
	});

	// Fetch counterparty data
	const counterparty = contract.counterpartyId
		? await getCounterpartyById(contract.counterpartyId)
		: null;
	const clientCounterparty =
		counterparty?.type === 'client' ? (counterparty as ClientCounterparty) : null;

	// Render template
	doc.render(buildRenderData(contract, clientCounterparty));

	return doc.getZip().generate({
		type: 'blob',
		mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
	});
}

/**
 * Build the render data object for the template.
 * All monetary amounts in the contract are NET of VAT.
 */
export function buildRenderData(
	contract: EquipmentRentalOneOffContract,
	clientCounterparty: ClientCounterparty | null
): Record<string, string | number> {
	const vatMultiplier = 1 + contract.vatRate / 100;

	// Gross amounts (net + VAT) for display
	const rentalFeeGross = Math.round(contract.contractValue * vatMultiplier);
	const depositGross = Math.round(contract.deposit * vatMultiplier);
	const replacementValueGross = Math.round(contract.replacementValue * vatMultiplier);

	return {
		// Contract Information
		contractNumber: contract.contractNumber,
		contractDateVietnamese: formatDateVietnamese(contract.eventDate),
		contractDateEnglish: formatDateEnglish(contract.eventDate),
		quotationReference: contract.quotationReference,

		// Party A (our company)
		partyACompanyVietnamese: companyConfig.nameVietnamese,
		partyACompanyEnglish: companyConfig.name,
		partyARepresentative: companyConfig.representative,
		partyAEmail: companyConfig.representativeEmail,
		partyAPhone: companyConfig.representativePhone,
		partyAAddressLine1: companyConfig.addressLine1,
		partyAAddressLine2: companyConfig.addressLine2,
		partyACity: companyConfig.city,
		partyATaxCode: companyConfig.taxCode,
		partyABankName: companyConfig.bankName || '',
		partyAAccountNumber: companyConfig.bankAccountNumber || '',

		// Party B (client)
		partyBCompanyVietnamese: clientCounterparty?.companyName || contract.counterpartyName,
		partyBCompanyEnglish: clientCounterparty?.companyName || contract.counterpartyName,
		partyBRepresentative: clientCounterparty?.representativeName || '',
		partyBPosition: clientCounterparty?.representativePosition || '',
		partyBAddressVietnamese: clientCounterparty?.address || '',
		partyBAddressEnglish: clientCounterparty?.address || '',
		partyBTaxCode: clientCounterparty?.taxId || '',
		partyBEmail: clientCounterparty?.email || '',
		partyBPhone: clientCounterparty?.phone || '',
		partyBBankName: clientCounterparty?.bankName || '',
		partyBAccountNumber: clientCounterparty?.bankAccountNumber || '',

		// Event details
		eventName: contract.eventName,
		eventDateVietnamese: formatDateVietnamese(contract.eventDate),
		eventDateEnglish: formatDateEnglish(contract.eventDate),

		// Setup & collection
		setupDateTimeVietnamese: formatDateTimeVietnamese(contract.setupDateTime),
		setupDateTimeEnglish: formatDateTimeEnglish(contract.setupDateTime),
		collectionDateTimeVietnamese: formatDateTimeVietnamese(contract.collectionDateTime),
		collectionDateTimeEnglish: formatDateTimeEnglish(contract.collectionDateTime),

		// Venue
		venueName: contract.venueName,
		venueNameEnglish: contract.venueNameEnglish,
		venueAddress: contract.venueAddress,
		venueAddressEnglish: contract.venueAddressEnglish,

		// Financial — NET amounts
		rentalFeeNetVND: formatCurrency(contract.contractValue),
		rentalFeeNetInWords: numberToVietnameseWords(contract.contractValue) + ' đồng',
		rentalFeeNetInWordsEnglish: numberToEnglishWords(contract.contractValue) + ' VND',

		// Financial — GROSS amounts (net + VAT)
		rentalFeeGrossVND: formatCurrency(rentalFeeGross),
		rentalFeeGrossInWords: numberToVietnameseWords(rentalFeeGross) + ' đồng',
		rentalFeeGrossInWordsEnglish: numberToEnglishWords(rentalFeeGross) + ' VND',

		// Also provide as contractValue aliases
		contractValueVND: formatCurrency(contract.contractValue),
		contractValueInWords: numberToVietnameseWords(contract.contractValue) + ' đồng',
		contractValueInWordsEnglish: numberToEnglishWords(contract.contractValue) + ' VND',

		// Deposit — NET
		depositNetVND: formatCurrency(contract.deposit),
		depositNetInWords: numberToVietnameseWords(contract.deposit) + ' đồng',
		depositNetInWordsEnglish: numberToEnglishWords(contract.deposit) + ' VND',

		// Deposit — GROSS
		depositGrossVND: formatCurrency(depositGross),
		depositGrossInWords: numberToVietnameseWords(depositGross) + ' đồng',
		depositGrossInWordsEnglish: numberToEnglishWords(depositGross) + ' VND',

		// Also provide simple deposit aliases
		depositVND: formatCurrency(contract.deposit),
		depositInWords: numberToVietnameseWords(contract.deposit) + ' đồng',
		depositInWordsEnglish: numberToEnglishWords(contract.deposit) + ' VND',

		// VAT
		vatRate: contract.vatRate,

		// Replacement value — NET
		replacementValueNetVND: formatCurrency(contract.replacementValue),
		replacementValueNetInWords: numberToVietnameseWords(contract.replacementValue) + ' đồng',
		replacementValueNetInWordsEnglish:
			numberToEnglishWords(contract.replacementValue) + ' VND',

		// Replacement value — GROSS
		replacementValueGrossVND: formatCurrency(replacementValueGross),
		replacementValueGrossInWords: numberToVietnameseWords(replacementValueGross) + ' đồng',
		replacementValueGrossInWordsEnglish:
			numberToEnglishWords(replacementValueGross) + ' VND',

		// Payment terms
		balancePaymentDays: contract.balancePaymentDays,
		latePaymentPenaltyRate: contract.latePaymentPenaltyRate,
		latePaymentPenaltyCap: contract.latePaymentPenaltyCap,

		// Cancellation terms
		cancellationTier1Days: contract.cancellationTier1Days,
		cancellationTier1Percent: contract.cancellationTier1Percent,
		cancellationTier2Days: contract.cancellationTier2Days,
		cancellationTier2Percent: contract.cancellationTier2Percent,

		// Equipment list (Annex 1 body text)
		equipmentList: contract.equipmentList
	};
}
