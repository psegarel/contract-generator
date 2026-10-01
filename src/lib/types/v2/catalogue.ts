import type { EquipmentCategory } from './quotation';

export interface EquipmentCatalogueItem {
	id: string;
	name: string;
	description: string | null;
	category: EquipmentCategory;
	manufacturer: string | null;
	rentalRateVnd: number | null;
	imageUrl: string | null;
	outsourced: boolean;
}
