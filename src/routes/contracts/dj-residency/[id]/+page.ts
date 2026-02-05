import { getDjResidencyContractById } from '$lib/utils/v2';
import { getCounterpartyById } from '$lib/utils/v2/counterparties';
import type { VenueCounterparty } from '$lib/types/v2';
import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';
import { logger } from '$lib/utils/logger';

// Disable SSR - Firebase client SDK needs browser auth context
export const ssr = false;

export const load: PageLoad = async ({ params }) => {
	try {
		logger.info(`Fetching DJ residency contract with ID: ${params.id}`);
		const contract = await getDjResidencyContractById(params.id);

		if (!contract) {
			logger.error(`Contract not found: ${params.id}`);
			throw error(404, 'DJ Residency contract not found');
		}

		logger.info('Contract fetched successfully', {
			id: contract.id,
			contractNumber: contract.contractNumber,
			type: contract.type,
			counterpartyName: contract.counterpartyName,
			residencyStatus: contract.residencyStatus
		});

		// Fetch the venue counterparty
		const counterparty = await getCounterpartyById(contract.counterpartyId);

		if (!counterparty || counterparty.type !== 'venue') {
			logger.error(`Counterparty not found for contract: ${contract.id}`);
			throw error(404, 'Counterparty (Party B) not found');
		}

		return {
			contract,
			venueCounterparty: counterparty as VenueCounterparty
		};
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) {
			throw e; // Re-throw SvelteKit errors
		}
		logger.error('Error loading DJ residency contract:', e);
		const errorMessage = e instanceof Error ? e.message : 'Unknown error';
		throw error(500, `Failed to load contract: ${errorMessage}`);
	}
};
