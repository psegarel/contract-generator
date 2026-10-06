import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getCounterparties } from '$lib/utils/v2/counterparties';
import { getQuotationCatalogue } from '$lib/utils/v2/catalogue';
import { getQuotationById } from '$lib/utils/v2/quotations';

export const ssr = false;

export const load: PageLoad = async ({ params }) => {
	const [quotation, counterparties, catalogue] = await Promise.all([
		getQuotationById(params.id),
		getCounterparties(),
		getQuotationCatalogue().catch((error: unknown) => ({
			items: [],
			packages: [],
			supportsPackages: false,
			error: error instanceof Error ? error.message : 'Unable to load equipment catalogue'
		}))
	]);

	if (!quotation) throw error(404, 'Quotation not found');

	return {
		quotation,
		clients: counterparties.filter((counterparty) => counterparty.type === 'client'),
		catalogueItems: catalogue.items,
		cataloguePackages: catalogue.packages,
		catalogueSupportsPackages: catalogue.supportsPackages,
		catalogueError: 'error' in catalogue ? catalogue.error : null
	};
};
