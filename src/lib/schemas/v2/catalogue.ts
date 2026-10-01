import { z } from 'zod';

export const equipmentCatalogueItemSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	description: z.string().nullable().optional(),
	category: z.enum(['audio', 'lighting', 'dj']),
	manufacturer: z.string().nullable().optional(),
	rentalRateVnd: z.number().int().min(0).nullable().optional(),
	imageUrl: z.url().nullable().optional(),
	outsourced: z.boolean().default(false)
});

export const equipmentCatalogueResponseSchema = z.union([
	z.array(equipmentCatalogueItemSchema),
	z.object({ items: z.array(equipmentCatalogueItemSchema) })
]);
