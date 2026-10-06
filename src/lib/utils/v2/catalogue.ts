import type { EquipmentCatalogueItem, QuotationPackageCatalogueItem } from '$lib/types/v2';
import { equipmentCatalogueResponseSchema, quotationPackageCatalogueSchema } from '$lib/schemas/v2';
import { z } from 'zod';
import { auth } from '$lib/config/firebase';
import { getCurrentUser } from '../auth';

export function parseEquipmentCatalogueResponse(value: unknown): EquipmentCatalogueItem[] {
	const parsed = equipmentCatalogueResponseSchema.safeParse(value);
	if (!parsed.success) {
		throw new Error('Equipment catalogue returned an invalid response');
	}

	const items = Array.isArray(parsed.data) ? parsed.data : parsed.data.items;
	return items.map((item) => ({
		...item,
		description: item.description ?? null,
		manufacturer: item.manufacturer ?? null,
		rentalRateVnd: item.rentalRateVnd ?? null,
		imageUrl: item.imageUrl ?? null
	}));
}

export interface QuotationCatalogue {
	items: EquipmentCatalogueItem[];
	packages: QuotationPackageCatalogueItem[];
	supportsPackages: boolean;
}

export function parseQuotationCatalogueResponse(value: unknown): QuotationCatalogue {
	if (Array.isArray(value)) {
		return { items: parseEquipmentCatalogueResponse(value), packages: [], supportsPackages: false };
	}
	if (!value || typeof value !== 'object' || !('items' in value)) {
		throw new Error('Equipment catalogue returned an invalid response');
	}
	const response = value as { items: unknown; packages?: unknown };
	const items = parseEquipmentCatalogueResponse(response);
	const supportsPackages = Object.hasOwn(value, 'packages');
	const packageValues = supportsPackages ? response.packages : [];
	const parsedPackages = equipmentCataloguePackagesSchema.safeParse(packageValues);
	if (!parsedPackages.success) {
		throw new Error('Equipment catalogue returned invalid package data');
	}
	return { items, packages: parsedPackages.data, supportsPackages };
}

const equipmentCataloguePackagesSchema = z.array(quotationPackageCatalogueSchema);

/**
 * Load the read-only catalogue feed owned by Insense Packages.
 * The URL is intentionally configured per environment; no Neon connection or
 * catalogue copy belongs in Contract Generator.
 */
export async function getQuotationCatalogue(): Promise<QuotationCatalogue> {
	const url = import.meta.env.VITE_EQUIPMENT_CATALOGUE_URL as string | undefined;
	if (!url) {
		throw new Error('Equipment catalogue integration is not configured');
	}

	// SvelteKit can start the client-side load before Firebase has restored the
	// persisted session. Wait for that state before reading the ID token.
	await auth.authStateReady();
	const token = await getCurrentUser()?.getIdToken();
	const response = await fetch(url, {
		credentials: 'include',
		headers: token ? { Authorization: `Bearer ${token}` } : undefined
	});
	if (!response.ok) {
		throw new Error(`Equipment catalogue request failed (${response.status})`);
	}

	return parseQuotationCatalogueResponse(await response.json());
}

/** Retained for callers that need only the equipment portion of the feed. */
export async function getEquipmentCatalogue(): Promise<EquipmentCatalogueItem[]> {
	return (await getQuotationCatalogue()).items;
}
