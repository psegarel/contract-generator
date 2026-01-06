import type { PageLoad } from './$types';
import { getEvents } from '$lib/utils/v2/events';
import { error } from '@sveltejs/kit';

// Disable SSR - Firebase client SDK needs browser auth context
export const ssr = false;

export const load: PageLoad = async () => {
	try {
		const events = await getEvents();
		return { events };
	} catch (e) {
		console.error('Error loading events:', e);
		const errorMessage = e instanceof Error ? e.message : 'Unknown error';
		throw error(500, `Failed to load events: ${errorMessage}`);
	}
};
