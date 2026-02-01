import {
	collection,
	addDoc,
	getDocs,
	getDoc,
	doc,
	updateDoc,
	query,
	where,
	orderBy,
	serverTimestamp,
	onSnapshot,
	deleteDoc,
	type Unsubscribe
} from 'firebase/firestore';
import { db } from '$lib/config/firebase';
import type { ServiceProvisionContract } from '$lib/types/v2';
import {
	serviceProvisionContractInputSchema,
	type ServiceProvisionContractInput
} from '$lib/schemas/v2';
import { logger } from '../logger';

const COLLECTION_NAME = 'service-provision-contracts';

/**
 * Subscribe to service provision contracts (real-time updates)
 */
export function subscribeToServiceProvisionContracts(
	callback: (contracts: ServiceProvisionContract[]) => void,
	onError: (error: Error) => void
): Unsubscribe {
	const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));

	return onSnapshot(
		q,
		(snapshot) => {
			const contracts = snapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data()
			})) as ServiceProvisionContract[];
			callback(contracts);
		},
		(error) => {
			logger.error('Error in service provision contracts subscription:', error);
			onError(error);
		}
	);
}

/**
 * Save a new service provision contract
 */
export async function saveServiceProvisionContract(
	contractData: ServiceProvisionContractInput
): Promise<string> {
	try {
		const validationResult = serviceProvisionContractInputSchema.safeParse(contractData);
		if (!validationResult.success) {
			logger.error('Validation error:', validationResult.error);
			throw new Error('Invalid contract data: ' + validationResult.error.message);
		}

		const toWrite = {
			...contractData,
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp()
		};

		const docRef = await addDoc(collection(db, COLLECTION_NAME), toWrite);
		return docRef.id;
	} catch (error) {
		logger.error('Error saving service provision contract:', error);
		throw new Error('Failed to save service provision contract');
	}
}

/**
 * Get service provision contract by ID
 */
export async function getServiceProvisionContractById(
	contractId: string
): Promise<ServiceProvisionContract | null> {
	try {
		const docRef = doc(db, COLLECTION_NAME, contractId);
		const docSnap = await getDoc(docRef);

		if (!docSnap.exists()) {
			return null;
		}

		return {
			id: docSnap.id,
			...docSnap.data()
		} as ServiceProvisionContract;
	} catch (error) {
		logger.error('Error fetching service provision contract:', error);
		throw new Error('Failed to fetch service provision contract');
	}
}

/**
 * Get all service provision contracts
 */
export async function getServiceProvisionContracts(): Promise<ServiceProvisionContract[]> {
	try {
		const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
		const querySnapshot = await getDocs(q);

		return querySnapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data()
		})) as ServiceProvisionContract[];
	} catch (error) {
		logger.error('Error fetching service provision contracts:', error);
		throw new Error('Failed to fetch service provision contracts');
	}
}

/**
 * Get service provision contracts by event ID
 */
export async function getServiceProvisionContractsByEventId(
	eventId: string
): Promise<ServiceProvisionContract[]> {
	try {
		const q = query(
			collection(db, COLLECTION_NAME),
			where('eventId', '==', eventId),
			orderBy('createdAt', 'desc')
		);

		const querySnapshot = await getDocs(q);
		return querySnapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data()
		})) as ServiceProvisionContract[];
	} catch (error) {
		logger.error('Error fetching service provision contracts by event:', error);
		throw new Error('Failed to fetch service provision contracts');
	}
}

/**
 * Update payment status
 */
export async function updateServiceProvisionContractPaymentStatus(
	contractId: string,
	status: 'unpaid' | 'paid',
	adminUid: string
): Promise<void> {
	try {
		const docRef = doc(db, COLLECTION_NAME, contractId);

		const docSnap = await getDoc(docRef);
		if (!docSnap.exists()) {
			throw new Error('Service provision contract not found');
		}

		await updateDoc(docRef, {
			paymentStatus: status,
			paidAt: status === 'paid' ? serverTimestamp() : null,
			paidBy: status === 'paid' ? adminUid : null,
			updatedAt: serverTimestamp()
		});
	} catch (error) {
		logger.error('Error updating payment status:', error);
		throw new Error('Failed to update payment status');
	}
}

/**
 * Update contract data (for editing)
 */
export async function updateServiceProvisionContract(
	contractId: string,
	updates: Partial<ServiceProvisionContract>
): Promise<void> {
	try {
		const docRef = doc(db, COLLECTION_NAME, contractId);

		const docSnap = await getDoc(docRef);
		if (!docSnap.exists()) {
			throw new Error('Service provision contract not found');
		}

		await updateDoc(docRef, {
			...updates,
			updatedAt: serverTimestamp()
		});
	} catch (error) {
		logger.error('Error updating service provision contract:', error);
		throw new Error('Failed to update service provision contract');
	}
}

/**
 * Delete service provision contract
 */
export async function deleteServiceProvisionContract(contractId: string): Promise<void> {
	try {
		const docRef = doc(db, COLLECTION_NAME, contractId);
		await deleteDoc(docRef);
	} catch (error) {
		logger.error('Error deleting service provision contract:', error);
		throw new Error('Failed to delete service provision contract');
	}
}
