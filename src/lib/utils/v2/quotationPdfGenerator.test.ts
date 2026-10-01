import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { generateQuotationPdf } from './quotationPdfGenerator';
import type { Quotation } from '$lib/types/v2';

const quotation = {
	id: 'quotation-1',
	quotationNumber: 'QT-2026-0001',
	revision: 1,
	status: 'draft',
	ownerUid: 'owner-1',
	customer: {
		type: 'lead',
		clientId: null,
		leadId: 'lead-1',
		name: 'Alex Example',
		companyName: 'Example Events',
		email: 'alex@example.com',
		phone: null,
		address: null
	},
	lineItems: [
		{
			catalogItemId: 'speaker-1',
			name: 'Speaker',
			category: 'audio',
			manufacturer: 'Insense',
			quantity: 2,
			unitPriceVnd: 1_000_000,
			imageUrl: null,
			note: null
		}
	],
	equipmentSubtotalVnd: 2_000_000,
	equipmentDiscountPercent: 10,
	equipmentDiscountVnd: 200_000,
	transportVnd: 100_000,
	handlingVnd: 50_000,
	totalVnd: 1_950_000,
	validUntil: '2026-10-30',
	eventName: 'Example event',
	eventDate: null,
	venue: 'Example venue',
	notes: 'Payment terms to be confirmed.',
	createdAt: null,
	updatedAt: null,
	sentAt: null,
	acceptedAt: null,
	declinedAt: null,
	expiredAt: null
} as unknown as Quotation;

describe('generateQuotationPdf', () => {
	it('creates a readable PDF without equipment images', async () => {
		const bytes = await generateQuotationPdf(quotation);
		const document = await PDFDocument.load(bytes);

		expect(document.getPages()).toHaveLength(1);
		expect(bytes.byteLength).toBeGreaterThan(1_000);
	});
});
