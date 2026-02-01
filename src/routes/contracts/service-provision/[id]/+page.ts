import { getServiceProvisionContractById } from '$lib/utils/v2';
import { generateServiceProvisionContractHtml } from '$lib/utils/v2/contractHtmlGenerator';
import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';
import { logger } from '$lib/utils/logger';

// Disable SSR - Firebase client SDK needs browser auth context
export const ssr = false;

export const load: PageLoad = async ({ params }) => {
	try {
		const contract = await getServiceProvisionContractById(params.id);

		if (!contract) {
			throw error(404, 'Service provision contract not found');
		}

		// Generate HTML preview from template
		const html = await generateServiceProvisionContractHtml(contract);

		return {
			contract,
			html
		};
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) {
			throw e; // Re-throw SvelteKit errors
		}
		logger.error('Error loading service provision contract:', e);
		const errorMessage = e instanceof Error ? e.message : 'Unknown error';
		throw error(500, `Failed to load contract: ${errorMessage}`);
	}
};
