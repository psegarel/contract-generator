import type { SavedServiceContract } from './serviceContracts';
import type { SavedEventPlanningContract } from './eventPlanningContracts';
import type { Timestamp } from 'firebase/firestore';

/**
 * Unified contract interface for displaying merged contracts
 * Contains only the common fields needed for dashboard list views
 */
export interface UnifiedContract {
	id: string;
	type: 'service' | 'event-planning';
	eventName: string;
	location: string;
	date: string;
	clientName: string;
	contractValue: number;
	paymentStatus: 'unpaid' | 'paid';
	createdAt: Timestamp;
	contractNumber: string;
}

/**
 * Convert a service contract to the unified format
 * Uses netFee as the base amount (before tax) - same as contractValue
 */
export function normalizeServiceContract(contract: SavedServiceContract): UnifiedContract {
	// netFee stores the base amount (before tax), same as contractValue
	const contractValue = contract.contractData.netFee;

	return {
		id: contract.id,
		type: 'service',
		eventName: contract.contractData.eventName,
		location: contract.contractData.eventLocation,
		date: contract.contractData.startDate,
		clientName: contract.contractData.clientName,
		contractValue,
		paymentStatus: contract.paymentStatus,
		createdAt: contract.createdAt,
		contractNumber: contract.contractNumber
	};
}

/**
 * Convert an event planning contract to the unified format
 */
export function normalizeEventPlanningContract(
	contract: SavedEventPlanningContract
): UnifiedContract {
	return {
		id: contract.id,
		type: 'event-planning',
		eventName: contract.contractData.eventName,
		location: contract.contractData.eventVenue,
		date: contract.contractData.eventDate,
		clientName: contract.contractData.clientCompany,
		contractValue: contract.contractData.contractValueVND,
		paymentStatus: contract.paymentStatus,
		createdAt: contract.createdAt,
		contractNumber: contract.contractNumber
	};
}

/**
 * Merge service and event planning contracts, sort by createdAt (newest first)
 */
export function mergeAndSortContracts(
	serviceContracts: SavedServiceContract[],
	eventPlanningContracts: SavedEventPlanningContract[],
	limit?: number
): UnifiedContract[] {
	const normalizedService = serviceContracts.map(normalizeServiceContract);
	const normalizedEventPlanning = eventPlanningContracts.map(normalizeEventPlanningContract);

	const merged = [...normalizedService, ...normalizedEventPlanning];

	// Sort by createdAt timestamp (newest first)
	merged.sort((a, b) => {
		const timeA = a.createdAt?.toMillis() || 0;
		const timeB = b.createdAt?.toMillis() || 0;
		return timeB - timeA;
	});

	return limit ? merged.slice(0, limit) : merged;
}
