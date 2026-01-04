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
import type { SubcontractorContract } from '$lib/types/v2';
import { subcontractorContractInputSchema } from '$lib/schemas/v2';

const COLLECTION_NAME = 'subcontractor-contracts';

/**
 * Subscribe to subcontractor contracts (real-time updates)
 */
export function subscribeToSubcontractorContracts(
	callback: (contracts: SubcontractorContract[]) => void,
	onError: (error: Error) => void
): Unsubscribe {
	const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));

	return onSnapshot(
		q,
		(snapshot) => {
			const contracts = snapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data()
			})) as SubcontractorContract[];
			callback(contracts);
		},
		(error) => {
			console.error('Error in subcontractor contracts subscription:', error);
			onError(error);
		}
	);
}

/**
 * Save a new subcontractor contract
 */
export async function saveSubcontractorContract(
	contractData: Omit<SubcontractorContract, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
	try {
		// Validate with schema
		const validationResult = subcontractorContractInputSchema.safeParse(contractData);
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
		console.error('Error saving subcontractor contract:', error);
		throw new Error('Failed to save subcontractor contract');
	}
}

/**
 * Get subcontractor contract by ID
 */
export async function getSubcontractorContractById(
	contractId: string
): Promise<SubcontractorContract | null> {
	try {
		const docRef = doc(db, COLLECTION_NAME, contractId);
		const docSnap = await getDoc(docRef);

		if (!docSnap.exists()) {
			return null;
		}

		return {
			id: docSnap.id,
			...docSnap.data()
		} as SubcontractorContract;
	} catch (error) {
		console.error('Error fetching subcontractor contract:', error);
		throw new Error('Failed to fetch subcontractor contract');
	}
}

/**
 * Get all subcontractor contracts
 */
export async function getSubcontractorContracts(): Promise<SubcontractorContract[]> {
	try {
		const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
		const querySnapshot = await getDocs(q);

		return querySnapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data()
		})) as SubcontractorContract[];
	} catch (error) {
		console.error('Error fetching subcontractor contracts:', error);
		throw new Error('Failed to fetch subcontractor contracts');
	}
}

/**
 * Get subcontractor contracts by event ID
 */
export async function getSubcontractorContractsByEventId(
	eventId: string
): Promise<SubcontractorContract[]> {
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
		})) as SubcontractorContract[];
	} catch (error) {
		console.error('Error fetching subcontractor contracts by event:', error);
		throw new Error('Failed to fetch subcontractor contracts');
	}
}

/**
 * Update payment status for a subcontractor contract
 */
export async function updateSubcontractorContractPaymentStatus(
	contractId: string,
	status: 'unpaid' | 'paid',
	adminUid: string
): Promise<void> {
	try {
		const docRef = doc(db, COLLECTION_NAME, contractId);

		const docSnap = await getDoc(docRef);
		if (!docSnap.exists()) {
			throw new Error('Subcontractor contract not found');
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
 * Delete subcontractor contract
 */
export async function deleteSubcontractorContract(contractId: string): Promise<void> {
	try {
		const docRef = doc(db, COLLECTION_NAME, contractId);
		await deleteDoc(docRef);
	} catch (error) {
		console.error('Error deleting subcontractor contract:', error);
		throw new Error('Failed to delete subcontractor contract');
	}
}
