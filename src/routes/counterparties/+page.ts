import type { PageLoad } from './$types';
import { getCounterparties } from '$lib/utils/v2/counterparties';
import { error } from '@sveltejs/kit';
import { logger } from '$lib/utils/logger';

// Disable SSR - Firebase client SDK needs browser auth context
export const ssr = false;

export const load: PageLoad = async () => {
	try {
		const counterparties = await getCounterparties();
		return { counterparties };
	} catch (e) {
		logger.error('Error loading counterparties:', e);
		const errorMessage = e instanceof Error ? e.message : 'Unknown error';
		throw error(500, `Failed to load counterparties: ${errorMessage}`);
	}
};
