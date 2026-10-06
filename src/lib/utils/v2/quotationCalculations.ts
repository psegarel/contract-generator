import type { QuotationLineItem, QuotationPackageCatalogueItem } from '$lib/types/v2';

export const OPEN_ENDED_PACKAGE_GUEST_SPAN = 100;

export interface QuotationTotals {
	equipmentSubtotalVnd: number;
	equipmentDiscountVnd: number;
	packageSubtotalVnd: number;
	packageDiscountVnd: number;
	totalVnd: number;
	lineTotalsVnd: number[];
}

/** Select a package price by interpolating within its guest and price ranges. */
export function calculatePackageQuotePrice(
	pkg: Pick<QuotationPackageCatalogueItem, 'guestRange' | 'priceRange'>,
	expectedGuests: number
): number {
	const minGuests = pkg.guestRange.min;
	const maxGuests = pkg.guestRange.max ?? minGuests + OPEN_ENDED_PACKAGE_GUEST_SPAN;
	const guests = Math.min(maxGuests, Math.max(minGuests, expectedGuests));
	const progress = maxGuests === minGuests ? 0 : (guests - minGuests) / (maxGuests - minGuests);
	return Math.round(
		pkg.priceRange.minVND + progress * (pkg.priceRange.maxVND - pkg.priceRange.minVND)
	);
}

/** Calculate all quotation totals using integer VND values. */
export function calculateQuotationTotals(
	lineItems: Pick<QuotationLineItem, 'quantity' | 'unitPriceVnd'>[],
	equipmentDiscountPercent: number,
	transportVnd: number,
	handlingVnd: number,
	packagePriceVnd = 0,
	packageDiscountPercent = 0
): QuotationTotals {
	const lineTotalsVnd = lineItems.map((item) => item.quantity * item.unitPriceVnd);
	const equipmentSubtotalVnd = lineTotalsVnd.reduce((total, lineTotal) => total + lineTotal, 0);
	const equipmentDiscountVnd = Math.round(equipmentSubtotalVnd * (equipmentDiscountPercent / 100));
	const packageSubtotalVnd = packagePriceVnd;
	const packageDiscountVnd = Math.round(packageSubtotalVnd * (packageDiscountPercent / 100));

	return {
		equipmentSubtotalVnd,
		equipmentDiscountVnd,
		packageSubtotalVnd,
		packageDiscountVnd,
		totalVnd:
			equipmentSubtotalVnd -
			equipmentDiscountVnd +
			packageSubtotalVnd -
			packageDiscountVnd +
			transportVnd +
			handlingVnd,
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
