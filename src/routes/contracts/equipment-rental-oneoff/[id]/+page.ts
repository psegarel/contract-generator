import { getEquipmentRentalOneOffContractById } from '$lib/utils/v2';
import { generateEquipmentRentalOneOffContractHtml } from '$lib/utils/v2/contractHtmlGenerator';
import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';
import { logger } from '$lib/utils/logger';

export const ssr = false;

export const load: PageLoad = async ({ params }) => {
	try {
		const contract = await getEquipmentRentalOneOffContractById(params.id);

		if (!contract) {
			throw error(404, 'Equipment rental one-off contract not found');
		}

		// Try to generate HTML preview (will fail if template not yet provided)
		let html: string | null = null;
		try {
			html = await generateEquipmentRentalOneOffContractHtml(contract);
		} catch (e) {
			logger.warn('Could not generate HTML preview (template may not exist yet):', e);
		}

		return {
			contract,
			html
		};
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) {
			throw e;
		}
		logger.error('Error loading equipment rental one-off contract:', e);
		const errorMessage = e instanceof Error ? e.message : 'Unknown error';
		throw error(500, `Failed to load contract: ${errorMessage}`);
	}
};
