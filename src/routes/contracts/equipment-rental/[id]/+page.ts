import { getEquipmentRentalContractById } from '$lib/utils/v2';
import { generateEquipmentRentalContractHtml } from '$lib/utils/v2/contractHtmlGenerator';
import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';
import { logger } from '$lib/utils/logger';

// Disable SSR - Firebase client SDK needs browser auth context
export const ssr = false;

export const load: PageLoad = async ({ params }) => {
	try {
		// Stage 1: Firestore Fetch
		logger.info(`[Stage 1] Fetching equipment rental contract with ID: ${params.id}`);
		const contract = await getEquipmentRentalContractById(params.id);

		if (!contract) {
			logger.error(`[Stage 1] Contract not found: ${params.id}`);
			throw error(404, 'Equipment rental contract not found');
		}

		// Log raw contract data from Firestore
		logger.info('[Stage 1] Contract fetched successfully', {
			id: contract.id,
			contractNumber: contract.contractNumber,
			type: contract.type,
			counterpartyId: contract.counterpartyId,
			counterpartyName: contract.counterpartyName,
			equipmentCount: contract.equipment?.length || 0,
			rentalStartDate: contract.rentalStartDate,
			rentalEndDate: contract.rentalEndDate,
			contractValue: contract.contractValue,
			hasEquipment: !!contract.equipment && contract.equipment.length > 0
		});

		// Stage 2: Pre-HTML Generation
		logger.info('[Stage 2] Validating contract data before HTML generation');
		const requiredFields = ['counterpartyId', 'equipment', 'rentalStartDate', 'rentalEndDate', 'contractValue'];
		const missingFields = requiredFields.filter(field => !(field in contract) || contract[field as keyof typeof contract] === undefined);
		
		if (missingFields.length > 0) {
			logger.error('[Stage 2] Missing required fields', { missingFields });
			throw new Error(`Contract missing required fields: ${missingFields.join(', ')}`);
		}

		if (!contract.equipment || contract.equipment.length === 0) {
			logger.error('[Stage 2] Contract has no equipment items');
			throw new Error('Contract must have at least one equipment item');
		}

		logger.info('[Stage 2] Contract data validated, proceeding to HTML generation');

		// Generate HTML preview from template
		logger.info('[Stage 2] Calling generateEquipmentRentalContractHtml');
		const html = await generateEquipmentRentalContractHtml(contract);

		return {
			contract,
			html
		};
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) {
			throw e; // Re-throw SvelteKit errors
		}
		logger.error('Error loading equipment rental contract:', e);
		const errorMessage = e instanceof Error ? e.message : 'Unknown error';
		throw error(500, `Failed to load contract: ${errorMessage}`);
	}
};
