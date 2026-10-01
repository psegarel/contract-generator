import type { PageLoad } from './$types';
import { getCounterparties } from '$lib/utils/v2/counterparties';
import { getEquipmentCatalogue } from '$lib/utils/v2/catalogue';
import { getQuotations } from '$lib/utils/v2/quotations';

export const ssr = false;

export const load: PageLoad = async () => {
	const [quotations, counterparties, catalogue] = await Promise.all([
		getQuotations(),
		getCounterparties(),
		getEquipmentCatalogue().catch((error: unknown) => ({
			items: [],
			error: error instanceof Error ? error.message : 'Unable to load equipment catalogue'
		}))
	]);

	return {
		quotations,
		clients: counterparties.filter((counterparty) => counterparty.type === 'client'),
		catalogueItems: Array.isArray(catalogue) ? catalogue : catalogue.items,
		catalogueError: Array.isArray(catalogue) ? null : catalogue.error
	};
};
