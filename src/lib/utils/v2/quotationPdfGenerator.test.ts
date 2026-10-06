import { PDFDocument } from 'pdf-lib';
import { readFile } from 'node:fs/promises';
import { describe, expect, it, vi } from 'vitest';
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

async function staticAssetResponse(url: string): Promise<Response> {
	const assets: Record<string, { path: string; contentType: string }> = {
		'/insense-logo.png': { path: '../../../../static/insense-logo.png', contentType: 'image/png' },
		'/fonts/BeVietnamPro-Regular.ttf': {
			path: '../../../../static/fonts/BeVietnamPro-Regular.ttf',
			contentType: 'font/ttf'
		},
		'/fonts/BeVietnamPro-Bold.ttf': {
			path: '../../../../static/fonts/BeVietnamPro-Bold.ttf',
			contentType: 'font/ttf'
		}
	};
	const asset = assets[url];
	if (!asset) return new Response(null, { status: 404 });
	return new Response(await readFile(new URL(asset.path, import.meta.url)), {
		status: 200,
		headers: { 'content-type': asset.contentType }
	});
}

describe('generateQuotationPdf', () => {
	it('creates a readable PDF without equipment images', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn((input: RequestInfo | URL) => staticAssetResponse(String(input)))
		);
		try {
			const bytes = await generateQuotationPdf(quotation);
			const document = await PDFDocument.load(bytes);

			expect(document.getPages()).toHaveLength(1);
			expect(bytes.byteLength).toBeGreaterThan(1_000);
		} finally {
			vi.unstubAllGlobals();
		}
	});

	it('creates a package-only quotation PDF', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn((input: RequestInfo | URL) => staticAssetResponse(String(input)))
		);
		try {
			const bytes = await generateQuotationPdf({
				...quotation,
				lineItems: [],
				equipmentSubtotalVnd: 0,
				equipmentDiscountVnd: 0,
				equipmentDiscountPercent: 0,
				totalVnd: 12_000_000,
				packageSnapshot: {
					slug: 'essential',
					name: 'Essential',
					tagline: 'A clear sound setup',
					description: 'A package for a small event.',
					guestRange: { min: 50, max: 100 },
					priceRange: { minVND: 10_000_000, maxVND: 15_000_000, currency: 'VND' },
					equipment: [
						{
							name: 'L-Acoustics X8',
							category: 'audio',
							quantity: 2,
							outsourced: false,
							manufacturer: 'L-Acoustics',
							imageUrl: null,
							note: null
						}
					],
					crew: [{ label: 'AV Technician', count: 1 }],
					highlights: [],
					expectedGuests: 75,
					quotedPriceVnd: 12_000_000
				}
			});
			const document = await PDFDocument.load(bytes);

			expect(document.getPages()).toHaveLength(1);
			expect(bytes.byteLength).toBeGreaterThan(1_000);
		} finally {
			vi.unstubAllGlobals();
		}
	});

	it('tries the ImageKit thumbnail URL and falls back to the catalogue image URL', async () => {
		const imageBytes = new Uint8Array(
			await readFile(new URL('../../../../static/insense-logo.png', import.meta.url))
		);
		const catalogueImageUrl = 'https://ik.imagekit.io/demo/equipment/jbl-eon715.jpg';
		const transformedUrl = new URL(catalogueImageUrl);
		transformedUrl.searchParams.set('tr', 'f-jpg,q-75,w-240,h-216,c-maintain_ratio');
		const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
			const url = String(input);
			if (url === transformedUrl.toString()) return new Response(null, { status: 503 });
			if (url === catalogueImageUrl) {
				return new Response(imageBytes, {
					status: 200,
					headers: { 'content-type': 'image/png' }
				});
			}
			return staticAssetResponse(url);
		});
		vi.stubGlobal('fetch', fetchMock);

		try {
			const bytes = await generateQuotationPdf({
				...quotation,
				lineItems: [{ ...quotation.lineItems[0], imageUrl: catalogueImageUrl }]
			});
			const document = await PDFDocument.load(bytes);
			const embeddedImageCount = (
				Buffer.from(bytes)
					.toString('latin1')
					.match(/\/Subtype\s*\/Image/g) ?? []
			).length;

			expect(document.getPages()).toHaveLength(1);
			expect(fetchMock).toHaveBeenCalledWith(transformedUrl.toString());
			expect(fetchMock).toHaveBeenCalledWith(catalogueImageUrl);
			expect(embeddedImageCount).toBeGreaterThanOrEqual(2);
		} finally {
			vi.unstubAllGlobals();
		}
	});

	it('keeps generating when the catalogue image is missing or unsupported', async () => {
		const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
			const url = String(input);
			if (url === 'https://ik.imagekit.io/demo/equipment/missing.jpg') {
				return new Response(null, { status: 404 });
			}
			if (url === 'https://images.example.test/equipment/unsupported.webp') {
				return new Response(new Uint8Array([1, 2, 3]), {
					status: 200,
					headers: { 'content-type': 'image/webp' }
				});
			}
			return staticAssetResponse(url);
		});
		vi.stubGlobal('fetch', fetchMock);

		try {
			const lineItems = [
				{
					...quotation.lineItems[0],
					imageUrl: 'https://ik.imagekit.io/demo/equipment/missing.jpg'
				},
				{
					...quotation.lineItems[0],
					catalogItemId: 'unsupported-image',
					imageUrl: 'https://images.example.test/equipment/unsupported.webp'
				}
			];
			const bytes = await generateQuotationPdf({ ...quotation, lineItems });
			const document = await PDFDocument.load(bytes);
			const embeddedImageCount = (
				Buffer.from(bytes)
					.toString('latin1')
					.match(/\/Subtype\s*\/Image/g) ?? []
			).length;

			expect(document.getPages()).toHaveLength(1);
			expect(embeddedImageCount).toBe(1); // The Insense logo remains; catalogue thumbnails are omitted.
		} finally {
			vi.unstubAllGlobals();
		}
	});
});
