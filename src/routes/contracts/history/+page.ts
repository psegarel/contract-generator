import type { PageLoad } from './$types';
import { getAllContracts } from '$lib/utils/contracts';
import { error } from '@sveltejs/kit';

export const load: PageLoad = async () => {
	try {
		const contracts = await getAllContracts();
		return { contracts };
	} catch (e) {
		console.error('Error loading contracts:', e);
		throw error(500, 'Failed to load contracts');
	}
};
