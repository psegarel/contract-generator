import type { PageLoad } from './$types';
import { getEventById } from '$lib/utils/v2/events';
import {
	getVenueRentalContractsByEventId,
	getServiceProvisionContractsByEventId,
	getEventPlanningContractsByEventId
} from '$lib/utils/v2';
import type { BaseContract } from '$lib/types/v2';
import { error } from '@sveltejs/kit';

// Disable SSR - Firebase client SDK needs browser auth context
export const ssr = false;

export const load: PageLoad = async ({ params }) => {
	try {
		const event = await getEventById(params.id);

		if (!event) {
			throw error(404, 'Event not found');
		}

		// Load all contracts for this event (from all types)
		const [venueContracts, serviceContracts, eventPlanningContracts] = await Promise.all([
			getVenueRentalContractsByEventId(params.id),
			getServiceProvisionContractsByEventId(params.id),
			getEventPlanningContractsByEventId(params.id)
		]);

		// Merge all contract types - TypeScript inheritance makes this work!
		const contracts: BaseContract[] = [
			...venueContracts,
			...serviceContracts,
			...eventPlanningContracts
		].sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

		return {
			event,
			contracts
		};
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) {
			throw e; // Re-throw SvelteKit errors
		}
		console.error('Error loading event:', e);
		const errorMessage = e instanceof Error ? e.message : 'Unknown error';
		throw error(500, `Failed to load event: ${errorMessage}`);
	}
};
