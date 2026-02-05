import { getDjResidencyContractById } from '$lib/utils/v2';
import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';
import { logger } from '$lib/utils/logger';

// Disable SSR - Firebase client SDK needs browser auth context
export const ssr = false;

export const load: PageLoad = async ({ params }) => {
	try {
		logger.info(`Fetching DJ residency contract for edit: ${params.id}`);
		const contract = await getDjResidencyContractById(params.id);

		if (!contract) {
			logger.error(`Contract not found: ${params.id}`);
			throw error(404, 'DJ Residency contract not found');
		}

		return {
			contract
		};
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) {
			throw e; // Re-throw SvelteKit errors
		}
		logger.error('Error loading DJ residency contract for edit:', e);
		const errorMessage = e instanceof Error ? e.message : 'Unknown error';
		throw error(500, `Failed to load contract: ${errorMessage}`);
	}
};
