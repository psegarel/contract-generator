import type { PageLoad } from './$types';
import { getCounterparties } from '$lib/utils/v2/counterparties';
import { getEquipmentCatalogue } from '$lib/utils/v2/catalogue';

export const ssr = false;

export const load: PageLoad = async () => {
	const [counterparties, catalogue] = await Promise.all([
		getCounterparties(),
		getEquipmentCatalogue().catch((error: unknown) => ({
			items: [],
			error: error instanceof Error ? error.message : 'Unable to load equipment catalogue'
		}))
	]);

	return {
		clients: counterparties.filter((counterparty) => counterparty.type === 'client'),
		catalogueItems: Array.isArray(catalogue) ? catalogue : catalogue.items,
		catalogueError: Array.isArray(catalogue) ? null : catalogue.error
	};
};
