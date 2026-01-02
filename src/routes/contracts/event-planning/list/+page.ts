import type { PageLoad } from './$types';
import { getEventPlanningContracts } from '$lib/utils/eventPlanningContracts';
import { error } from '@sveltejs/kit';

// Disable SSR - Firebase client SDK needs browser auth context
export const ssr = false;

export const load: PageLoad = async () => {
	try {
		const contracts = await getEventPlanningContracts();
		return { contracts };
	} catch (e) {
		console.error('Error loading event planning contracts:', e);
		const errorMessage = e instanceof Error ? e.message : 'Unknown error';
		const errorDetails = e instanceof Error ? e.stack : String(e);
		console.error('Error details:', errorDetails);
		throw error(500, `Failed to load event planning contracts: ${errorMessage}`);
	}
};
