import type { PageLoad } from './$types';

export const load: PageLoad = ({ url }) => {
	return {
		eventId: url.searchParams.get('eventId') || null
	};
};



