import type { PageLoad } from './$types';
import { getCounterparties } from '$lib/utils/v2/counterparties';
import { getQuotationCatalogue } from '$lib/utils/v2/catalogue';

export const ssr = false;

export const load: PageLoad = async () => {
	const [counterparties, catalogue] = await Promise.all([
		getCounterparties(),
		getQuotationCatalogue().catch((error: unknown) => ({
			items: [],
			packages: [],
			supportsPackages: false,
			error: error instanceof Error ? error.message : 'Unable to load equipment catalogue'
		}))
	]);

	return {
		clients: counterparties.filter((counterparty) => counterparty.type === 'client'),
		catalogueItems: catalogue.items,
		cataloguePackages: catalogue.packages,
		catalogueSupportsPackages: catalogue.supportsPackages,
		catalogueError: 'error' in catalogue ? catalogue.error : null
	};
};
