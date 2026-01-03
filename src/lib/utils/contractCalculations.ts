import type { SavedEventPlanningContract } from '$lib/utils/eventPlanningContracts';

export type Contract = SavedEventPlanningContract;

export const sumContracts = (contracts: Contract[]): number => {
	return contracts
		.filter((contract) => contract.type === 'event-planning')
		.reduce((total, contract) => {
			return total + (contract.contractData.contractValueVND || 0);
		}, 0);
};