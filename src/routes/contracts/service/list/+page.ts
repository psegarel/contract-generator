import type { PageLoad } from './$types';
import { getServiceContracts } from '$lib/utils/serviceContracts';
import { error } from '@sveltejs/kit';

// Disable SSR - Firebase client SDK needs browser auth context
export const ssr = false;

export const load: PageLoad = async () => {
	try {
		const contracts = await getServiceContracts();
		return { contracts };
	} catch (e) {
		console.error('Error loading service contracts:', e);
		const errorMessage = e instanceof Error ? e.message : 'Unknown error';
		const errorDetails = e instanceof Error ? e.stack : String(e);
		console.error('Error details:', errorDetails);
		throw error(500, `Failed to load service contracts: ${errorMessage}`);
	}
};
