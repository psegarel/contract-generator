import { describe, expect, it } from 'vitest';
import { parseEquipmentCatalogueResponse } from './catalogue';

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
