import type { PageLoad } from './$types';
import { getLeads } from '$lib/utils/v2/leads';

export const ssr = false;

export const load: PageLoad = async () => ({ leads: await getLeads() });
