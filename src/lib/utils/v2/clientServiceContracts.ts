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
import type { ClientServiceContract } from '$lib/types/v2';
import { clientServiceContractInputSchema } from '$lib/schemas/v2';

const COLLECTION_NAME = 'client-service-contracts';

/**
 * Subscribe to client service contracts (real-time updates)
 */
export function subscribeToClientServiceContracts(
	callback: (contracts: ClientServiceContract[]) => void,
	onError: (error: Error) => void
): Unsubscribe {
	const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));

	return onSnapshot(
		q,
		(snapshot) => {
			const contracts = snapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data()
			})) as ClientServiceContract[];
			callback(contracts);
		},
		(error) => {
			console.error('Error in client service contracts subscription:', error);
			onError(error);
		}
	);
}

/**
 * Save a new client service contract
 */
export async function saveClientServiceContract(
	contractData: Omit<ClientServiceContract, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
	try {
		// Validate with schema
		const validationResult = clientServiceContractInputSchema.safeParse(contractData);
		if (!validationResult.success) {
			console.error('Validation error:', validationResult.error);
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
		console.error('Error saving client service contract:', error);
		throw new Error('Failed to save client service contract');
	}
}

/**
 * Get client service contract by ID
 */
export async function getClientServiceContractById(
	contractId: string
): Promise<ClientServiceContract | null> {
	try {
		const docRef = doc(db, COLLECTION_NAME, contractId);
		const docSnap = await getDoc(docRef);

		if (!docSnap.exists()) {
			return null;
		}

		return {
			id: docSnap.id,
			...docSnap.data()
		} as ClientServiceContract;
	} catch (error) {
		console.error('Error fetching client service contract:', error);
		throw new Error('Failed to fetch client service contract');
	}
}

/**
 * Get all client service contracts
 */
export async function getClientServiceContracts(): Promise<ClientServiceContract[]> {
	try {
		const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
		const querySnapshot = await getDocs(q);

		return querySnapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data()
		})) as ClientServiceContract[];
	} catch (error) {
		console.error('Error fetching client service contracts:', error);
		throw new Error('Failed to fetch client service contracts');
	}
}

/**
 * Get client service contracts by event ID
 */
export async function getClientServiceContractsByEventId(
	eventId: string
): Promise<ClientServiceContract[]> {
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
		})) as ClientServiceContract[];
	} catch (error) {
		console.error('Error fetching client service contracts by event:', error);
		throw new Error('Failed to fetch client service contracts');
	}
}

/**
 * Update payment status for a client service contract
 */
export async function updateClientServiceContractPaymentStatus(
	contractId: string,
	status: 'unpaid' | 'paid',
	adminUid: string
): Promise<void> {
	try {
		const docRef = doc(db, COLLECTION_NAME, contractId);

		const docSnap = await getDoc(docRef);
		if (!docSnap.exists()) {
			throw new Error('Client service contract not found');
		}

		await updateDoc(docRef, {
			paymentStatus: status,
			paidAt: status === 'paid' ? serverTimestamp() : null,
			paidBy: status === 'paid' ? adminUid : null,
			updatedAt: serverTimestamp()
		});
	} catch (error) {
		console.error('Error updating payment status:', error);
		throw new Error('Failed to update payment status');
	}
}

/**
 * Delete client service contract
 */
export async function deleteClientServiceContract(contractId: string): Promise<void> {
	try {
		const docRef = doc(db, COLLECTION_NAME, contractId);
		await deleteDoc(docRef);
	} catch (error) {
		console.error('Error deleting client service contract:', error);
		throw new Error('Failed to delete client service contract');
	}
}
