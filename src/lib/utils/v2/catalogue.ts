import type { EquipmentCatalogueItem } from '$lib/types/v2';
import { equipmentCatalogueResponseSchema } from '$lib/schemas/v2';
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

/**
 * Load the read-only catalogue feed owned by Insense Packages.
 * The URL is intentionally configured per environment; no Neon connection or
 * catalogue copy belongs in Contract Generator.
 */
export async function getEquipmentCatalogue(): Promise<EquipmentCatalogueItem[]> {
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

	return parseEquipmentCatalogueResponse(await response.json());
}
