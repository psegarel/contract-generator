import { describe, expect, it } from 'vitest';
import {
	calculateQuotationTotals,
	calculatePackageQuotePrice,
	isQuotationExpired,
	normalizeEmail
} from './quotationCalculations';

describe('calculateQuotationTotals', () => {
	it('discounts equipment only', () => {
		expect(
			calculateQuotationTotals(
				[
					{ quantity: 2, unitPriceVnd: 1_000_000 },
					{ quantity: 1, unitPriceVnd: 500_000 }
				],
				10,
				200_000,
				300_000
			)
		).toEqual({
			equipmentSubtotalVnd: 2_500_000,
			equipmentDiscountVnd: 250_000,
			packageSubtotalVnd: 0,
			packageDiscountVnd: 0,
			totalVnd: 2_750_000,
			lineTotalsVnd: [2_000_000, 500_000]
		});
	});

	it('prices a package by interpolating its guest range', () => {
		const pkg = {
			guestRange: { min: 100, max: 200 },
			priceRange: { minVND: 10_000_000, maxVND: 20_000_000, currency: 'VND' as const }
		};
		expect(calculatePackageQuotePrice(pkg, 100)).toBe(10_000_000);
		expect(calculatePackageQuotePrice(pkg, 150)).toBe(15_000_000);
		expect(calculatePackageQuotePrice(pkg, 200)).toBe(20_000_000);
	});

	it('uses min through min plus 100 as the open-ended pricing range', () => {
		const pkg = {
			guestRange: { min: 400, max: null },
			priceRange: { minVND: 40_000_000, maxVND: 50_000_000, currency: 'VND' as const }
		};
		expect(calculatePackageQuotePrice(pkg, 400)).toBe(40_000_000);
		expect(calculatePackageQuotePrice(pkg, 450)).toBe(45_000_000);
		expect(calculatePackageQuotePrice(pkg, 500)).toBe(50_000_000);
		expect(calculatePackageQuotePrice(pkg, 700)).toBe(50_000_000);
	});

	it('discounts packages and equipment independently', () => {
		expect(
			calculateQuotationTotals([{ quantity: 1, unitPriceVnd: 1_000_000 }], 10, 0, 0, 10_000_000, 20)
		).toMatchObject({
			equipmentDiscountVnd: 100_000,
			packageDiscountVnd: 2_000_000,
			totalVnd: 8_900_000
		});
	});

	it('handles zero discount and zero logistics', () => {
		expect(
			calculateQuotationTotals([{ quantity: 3, unitPriceVnd: 125_000 }], 0, 0, 0).totalVnd
		).toBe(375_000);
	});

	it('rounds fractional VND discount amounts', () => {
		expect(
			calculateQuotationTotals([{ quantity: 1, unitPriceVnd: 101 }], 33.333, 0, 0)
		).toMatchObject({ equipmentDiscountVnd: 34, totalVnd: 67 });
	});
});

describe('normalizeEmail', () => {
	it('trims and lowercases email addresses', () => {
		expect(normalizeEmail('  Lead@Example.COM ')).toBe('lead@example.com');
	});
});

describe('isQuotationExpired', () => {
	it('keeps a quotation valid through its validity date', () => {
		expect(isQuotationExpired('2026-10-30', new Date('2026-10-30T12:00:00'))).toBe(false);
	});

	it('expires a quotation after its validity date', () => {
		expect(isQuotationExpired('2026-10-30', new Date('2026-10-31T00:00:00'))).toBe(true);
	});
});
