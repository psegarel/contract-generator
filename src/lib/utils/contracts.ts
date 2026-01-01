import { ContractRepository } from './ContractRepository';
import type { ContractData } from '$lib/schemas/contract';
import type { EventPlanningContractData } from '$lib/schemas/eventPlanningContract';
import type { SavedContract } from './ContractRepository';

// Re-export types for backward compatibility
export type { SavedContract, SavedContractInput } from './ContractRepository';

// Singleton instance for backward compatibility
const repository = new ContractRepository();

// Legacy function exports - delegate to repository
export async function saveContract(
	ownerUid: string,
	contractType: 'service',
	contractData: ContractData,
	contractNumber: string,
	locationId: string
): Promise<string> {
	return repository.save(ownerUid, contractType, contractData, contractNumber, locationId);
}

/**
 * Type-safe wrapper for saving event planning contracts
 */
export async function saveEventPlanningContract(
	ownerUid: string,
	contractData: EventPlanningContractData,
	contractNumber: string,
	locationId: string
): Promise<string> {
	return repository.save(ownerUid, 'event-planning', contractData, contractNumber, locationId);
}

export async function updatePaymentStatus(
	contractId: string,
	status: 'unpaid' | 'paid',
	adminUid: string
): Promise<void> {
	return repository.updatePaymentStatus(contractId, status, adminUid);
}

export async function getContractsByLocationId(locationId: string): Promise<SavedContract[]> {
	return repository.getByLocationId(locationId);
}

export async function getAllContracts(): Promise<SavedContract[]> {
	return repository.getAll();
}

export async function getContract(contractId: string): Promise<SavedContract | null> {
	return repository.getById(contractId);
}

export async function updateContract(
	contractId: string,
	contractData: ContractData | EventPlanningContractData
): Promise<void> {
	return repository.update(contractId, contractData);
}

// Re-export repository class for those who want to use it directly
export { ContractRepository };
