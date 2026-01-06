import { getCounterpartyById } from '$lib/utils/v2';
import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';

// Disable SSR - Firebase client SDK needs browser auth context
export const ssr = false;

export const load: PageLoad = async ({ params }) => {
	try {
		const counterparty = await getCounterpartyById(params.id);

		if (!counterparty) {
			throw error(404, 'Counterparty not found');
		}

		return {
			counterparty
		};
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) {
			throw e; // Re-throw SvelteKit errors
		}
		console.error('Error loading counterparty:', e);
		const errorMessage = e instanceof Error ? e.message : 'Unknown error';
		throw error(500, `Failed to load counterparty: ${errorMessage}`);
	}
};
