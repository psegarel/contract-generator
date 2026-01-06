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
import type { PerformerBookingContract } from '$lib/types/v2';
import { performerBookingContractInputSchema } from '$lib/schemas/v2';

const COLLECTION_NAME = 'performer-booking-contracts';

/**
 * Subscribe to performer booking contracts (real-time updates)
 */
export function subscribeToPerformerBookingContracts(
	callback: (contracts: PerformerBookingContract[]) => void,
	onError: (error: Error) => void
): Unsubscribe {
	const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));

	return onSnapshot(
		q,
		(snapshot) => {
			const contracts = snapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data()
			})) as PerformerBookingContract[];
			callback(contracts);
		},
		(error) => {
			console.error('Error in performer booking contracts subscription:', error);
			onError(error);
		}
	);
}

/**
 * Save a new performer booking contract
 */
export async function savePerformerBookingContract(
	contractData: Omit<PerformerBookingContract, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
	try {
		// Validate with schema
		const validationResult = performerBookingContractInputSchema.safeParse(contractData);
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
		console.error('Error saving performer booking contract:', error);
		throw new Error('Failed to save performer booking contract');
	}
}

/**
 * Get performer booking contract by ID
 */
export async function getPerformerBookingContractById(
	contractId: string
): Promise<PerformerBookingContract | null> {
	try {
		const docRef = doc(db, COLLECTION_NAME, contractId);
		const docSnap = await getDoc(docRef);

		if (!docSnap.exists()) {
			return null;
		}

		return {
			id: docSnap.id,
			...docSnap.data()
		} as PerformerBookingContract;
	} catch (error) {
		console.error('Error fetching performer booking contract:', error);
		throw new Error('Failed to fetch performer booking contract');
	}
}

/**
 * Get all performer booking contracts
 */
export async function getPerformerBookingContracts(): Promise<PerformerBookingContract[]> {
	try {
		const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
		const querySnapshot = await getDocs(q);

		return querySnapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data()
		})) as PerformerBookingContract[];
	} catch (error) {
		console.error('Error fetching performer booking contracts:', error);
		throw new Error('Failed to fetch performer booking contracts');
	}
}

/**
 * Get performer booking contracts by event ID
 */
export async function getPerformerBookingContractsByEventId(
	eventId: string
): Promise<PerformerBookingContract[]> {
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
		})) as PerformerBookingContract[];
	} catch (error) {
		console.error('Error fetching performer booking contracts by event:', error);
		throw new Error('Failed to fetch performer booking contracts');
	}
}

/**
 * Update payment status for a performer booking contract
 */
export async function updatePerformerBookingContractPaymentStatus(
	contractId: string,
	status: 'unpaid' | 'paid',
	adminUid: string
): Promise<void> {
	try {
		const docRef = doc(db, COLLECTION_NAME, contractId);

		const docSnap = await getDoc(docRef);
		if (!docSnap.exists()) {
			throw new Error('Performer booking contract not found');
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
 * Delete performer booking contract
 */
export async function deletePerformerBookingContract(contractId: string): Promise<void> {
	try {
		const docRef = doc(db, COLLECTION_NAME, contractId);
		await deleteDoc(docRef);
	} catch (error) {
		console.error('Error deleting performer booking contract:', error);
		throw new Error('Failed to delete performer booking contract');
	}
}
