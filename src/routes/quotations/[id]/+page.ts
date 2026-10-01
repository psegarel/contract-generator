import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getQuotationById } from '$lib/utils/v2/quotations';

export const ssr = false;

export const load: PageLoad = async ({ params }) => {
	const quotation = await getQuotationById(params.id);
	if (!quotation) throw error(404, 'Quotation not found');
	return { quotation };
};
