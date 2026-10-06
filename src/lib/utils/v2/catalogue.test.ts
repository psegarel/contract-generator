import { describe, expect, it } from 'vitest';
import { parseEquipmentCatalogueResponse, parseQuotationCatalogueResponse } from './catalogue';

const item = {
	id: 'speaker-1',
	name: 'X8',
	description: 'Compact loudspeaker',
	category: 'audio',
	manufacturer: 'L-Acoustics',
	rentalRateVnd: 1_500_000,
	imageUrl: 'https://example.com/x8.jpg',
	outsourced: false
};

describe('parseEquipmentCatalogueResponse', () => {
	it('normalizes a direct catalogue item array', () => {
		expect(parseEquipmentCatalogueResponse([item])).toEqual([item]);
	});

	it('accepts the wrapped feed format', () => {
		expect(parseEquipmentCatalogueResponse({ items: [item] })).toEqual([item]);
	});

	it('rejects missing commercial fields', () => {
		expect(() => parseEquipmentCatalogueResponse([{ ...item, rentalRateVnd: '1500000' }])).toThrow(
			'Equipment catalogue returned an invalid response'
		);
	});
});

describe('parseQuotationCatalogueResponse', () => {
	it('keeps compatibility with the previous equipment-only feed', () => {
		expect(parseQuotationCatalogueResponse([item])).toEqual({
			items: [expect.objectContaining({ id: item.id })],
			packages: [],
			supportsPackages: false
		});
	});

	it('parses package content from the expanded feed', () => {
		const pkg = {
			slug: 'essential',
			name: 'Essential',
			tagline: 'A clear sound setup',
			description: 'For small events',
			guestRange: { min: 50, max: 100 },
			priceRange: { minVND: 10_000_000, maxVND: 15_000_000, currency: 'VND' },
			equipment: [
				{
					name: 'X8',
					category: 'audio',
					quantity: 2,
					outsourced: false,
					manufacturer: 'L-Acoustics',
					imageUrl: 'https://example.com/x8.jpg',
					note: null
				}
			],
			crew: [{ label: 'AV Technician', count: 1 }],
			highlights: ['Clear sound']
		};

		expect(parseQuotationCatalogueResponse({ items: [item], packages: [pkg] })).toEqual({
			items: [expect.objectContaining({ id: item.id })],
			packages: [pkg],
			supportsPackages: true
		});
	});
});
