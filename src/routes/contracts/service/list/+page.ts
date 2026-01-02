import type { PageLoad } from './$types';
import { getServiceContracts } from '$lib/utils/serviceContracts';
import { error } from '@sveltejs/kit';

export const load: PageLoad = async () => {
	try {
		const contracts = await getServiceContracts();
		return { contracts };
	} catch (e) {
		console.error('Error loading service contracts:', e);
		throw error(500, 'Failed to load service contracts');
	}
};
