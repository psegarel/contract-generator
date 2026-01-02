import {
	saveServiceContract,
	getServiceContracts,
	getServiceContractById,
	updateServiceContract,
	updateServiceContractPaymentStatus,
	getServiceContractsByLocationId,
	type SavedServiceContract,
	type SavedServiceContractInput
} from './serviceContracts';
import type { ContractData } from '$lib/schemas/contract';

// Re-export types
export type SavedContract = SavedServiceContract;
export type SavedContractInput = SavedServiceContractInput;

// Function exports - delegate to service contracts repository
export async function saveContract(
	ownerUid: string,
	_contractType: 'service',
	contractData: ContractData,
	contractNumber: string,
	locationId: string
): Promise<string> {
	return saveServiceContract(ownerUid, contractData, contractNumber, locationId);
}

export async function updatePaymentStatus(
	contractId: string,
	status: 'unpaid' | 'paid',
	adminUid: string
): Promise<void> {
	return updateServiceContractPaymentStatus(contractId, status, adminUid);
}

export async function getContractsByLocationId(locationId: string): Promise<SavedContract[]> {
	return getServiceContractsByLocationId(locationId);
}

export async function getAllContracts(): Promise<SavedContract[]> {
	return getServiceContracts();
}

export async function getContract(contractId: string): Promise<SavedContract | null> {
	return getServiceContractById(contractId);
}

export async function updateContract(
	contractId: string,
	contractData: ContractData
): Promise<void> {
	return updateServiceContract(contractId, contractData);
}
