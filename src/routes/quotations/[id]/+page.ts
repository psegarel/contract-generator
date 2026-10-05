import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getQuotationById, getQuotationRevisionHistory } from '$lib/utils/v2/quotations';

export const ssr = false;

export const load: PageLoad = async ({ params }) => {
	const quotation = await getQuotationById(params.id);
	if (!quotation) throw error(404, 'Quotation not found');
	const revisionHistory = await getQuotationRevisionHistory(quotation);
	return { quotation, revisionHistory };
};
