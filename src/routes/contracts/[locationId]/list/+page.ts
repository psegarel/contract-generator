import type { PageLoad } from './$types';
import { getLocation } from '$lib/utils/locations';
import { getContractsByLocationId } from '$lib/utils/contracts';
import { error } from '@sveltejs/kit';

export const load: PageLoad = async ({ params }) => {
	const locationId = params.locationId;

	try {
		const [location, contracts] = await Promise.all([
			getLocation(locationId),
			getContractsByLocationId(locationId)
		]);

		if (!location) {
			throw error(404, 'Location not found');
		}

		return {
			locationName: location.name,
			contracts
		};
	} catch (e) {
		console.error('Error loading data:', e);
		throw error(500, 'Failed to load contracts');
	}
};
