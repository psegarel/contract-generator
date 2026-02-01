import { getEquipmentRentalContractById } from '$lib/utils/v2';
import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';
import { logger } from '$lib/utils/logger';

// Disable SSR - Firebase client SDK needs browser auth context
export const ssr = false;

export const load: PageLoad = async ({ params }) => {
	try {
		const contract = await getEquipmentRentalContractById(params.id);

		if (!contract) {
			throw error(404, 'Equipment rental contract not found');
		}

		return {
			contract
		};
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) {
			throw e; // Re-throw SvelteKit errors
		}
		logger.error('Error loading equipment rental contract:', e);
		const errorMessage = e instanceof Error ? e.message : 'Unknown error';
		throw error(500, `Failed to load contract: ${errorMessage}`);
	}
};
