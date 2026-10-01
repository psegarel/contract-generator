import { describe, expect, it } from 'vitest';
import {
	calculateQuotationTotals,
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
			totalVnd: 2_750_000,
			lineTotalsVnd: [2_000_000, 500_000]
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
