import type { QuotationLineItem } from '$lib/types/v2';

export interface QuotationTotals {
	equipmentSubtotalVnd: number;
	equipmentDiscountVnd: number;
	totalVnd: number;
	lineTotalsVnd: number[];
}

/** Calculate all quotation totals using integer VND values. */
export function calculateQuotationTotals(
	lineItems: Pick<QuotationLineItem, 'quantity' | 'unitPriceVnd'>[],
	equipmentDiscountPercent: number,
	transportVnd: number,
	handlingVnd: number
): QuotationTotals {
	const lineTotalsVnd = lineItems.map((item) => item.quantity * item.unitPriceVnd);
	const equipmentSubtotalVnd = lineTotalsVnd.reduce((total, lineTotal) => total + lineTotal, 0);
	const equipmentDiscountVnd = Math.round(equipmentSubtotalVnd * (equipmentDiscountPercent / 100));

	return {
		equipmentSubtotalVnd,
		equipmentDiscountVnd,
		totalVnd: equipmentSubtotalVnd - equipmentDiscountVnd + transportVnd + handlingVnd,
		lineTotalsVnd
	};
}

/** Calculate optional VAT over the complete pre-VAT quotation total. */
export function calculateQuotationVat(
	totalBeforeVatVnd: number,
	ratePercent: number | null
): number {
	if (ratePercent === null) return 0;
	return Math.round((totalBeforeVatVnd * ratePercent) / 100);
}

export function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

export function isQuotationExpired(validUntil: string, now = new Date()): boolean {
	const expiry = new Date(`${validUntil}T00:00:00`);
	if (Number.isNaN(expiry.getTime())) return true;

	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	return expiry < today;
}
