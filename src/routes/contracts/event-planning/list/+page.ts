import type { PageLoad } from './$types';
import { getEventPlanningContracts } from '$lib/utils/eventPlanningContracts';
import { error } from '@sveltejs/kit';

export const load: PageLoad = async () => {
	try {
		const contracts = await getEventPlanningContracts();
		return { contracts };
	} catch (e) {
		console.error('Error loading event planning contracts:', e);
		throw error(500, 'Failed to load event planning contracts');
	}
};
