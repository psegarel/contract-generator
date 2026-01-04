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
import type { EventPlanningContract } from '$lib/types/v2';
import {
	eventPlanningContractInputSchema,
	type EventPlanningContractInput
} from '$lib/schemas/v2';

const COLLECTION_NAME = 'event-planning-contracts';

/**
 * Subscribe to event planning contracts (real-time updates)
 */
export function subscribeToEventPlanningContracts(
	callback: (contracts: EventPlanningContract[]) => void,
	onError: (error: Error) => void
): Unsubscribe {
	const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));

	return onSnapshot(
		q,
		(snapshot) => {
			const contracts = snapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data()
			})) as EventPlanningContract[];
			callback(contracts);
		},
		(error) => {
			console.error('Error in event planning contracts subscription:', error);
			onError(error);
		}
	);
}

/**
 * Save a new event planning contract
 */
export async function saveEventPlanningContract(
	contractData: EventPlanningContractInput
): Promise<string> {
	try {
		const validationResult = eventPlanningContractInputSchema.safeParse(contractData);
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
		console.error('Error saving event planning contract:', error);
		throw new Error('Failed to save event planning contract');
	}
}

/**
 * Get event planning contract by ID
 */
export async function getEventPlanningContractById(
	contractId: string
): Promise<EventPlanningContract | null> {
	try {
		const docRef = doc(db, COLLECTION_NAME, contractId);
		const docSnap = await getDoc(docRef);

		if (!docSnap.exists()) {
			return null;
		}

		return {
			id: docSnap.id,
			...docSnap.data()
		} as EventPlanningContract;
	} catch (error) {
		console.error('Error fetching event planning contract:', error);
		throw new Error('Failed to fetch event planning contract');
	}
}

/**
 * Get all event planning contracts
 */
export async function getEventPlanningContracts(): Promise<EventPlanningContract[]> {
	try {
		const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
		const querySnapshot = await getDocs(q);

		return querySnapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data()
		})) as EventPlanningContract[];
	} catch (error) {
		console.error('Error fetching event planning contracts:', error);
		throw new Error('Failed to fetch event planning contracts');
	}
}

/**
 * Get event planning contracts by event ID
 */
export async function getEventPlanningContractsByEventId(
	eventId: string
): Promise<EventPlanningContract[]> {
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
		})) as EventPlanningContract[];
	} catch (error) {
		console.error('Error fetching event planning contracts by event:', error);
		throw new Error('Failed to fetch event planning contracts');
	}
}

/**
 * Update payment status
 */
export async function updateEventPlanningContractPaymentStatus(
	contractId: string,
	status: 'unpaid' | 'paid',
	adminUid: string
): Promise<void> {
	try {
		const docRef = doc(db, COLLECTION_NAME, contractId);

		const docSnap = await getDoc(docRef);
		if (!docSnap.exists()) {
			throw new Error('Event planning contract not found');
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
 * Update contract data
 */
export async function updateEventPlanningContract(
	contractId: string,
	updates: Partial<EventPlanningContract>
): Promise<void> {
	try {
		const docRef = doc(db, COLLECTION_NAME, contractId);

		const docSnap = await getDoc(docRef);
		if (!docSnap.exists()) {
			throw new Error('Event planning contract not found');
		}

		await updateDoc(docRef, {
			...updates,
			updatedAt: serverTimestamp()
		});
	} catch (error) {
		console.error('Error updating event planning contract:', error);
		throw new Error('Failed to update event planning contract');
	}
}

/**
 * Delete event planning contract
 */
export async function deleteEventPlanningContract(contractId: string): Promise<void> {
	try {
		const docRef = doc(db, COLLECTION_NAME, contractId);
		await deleteDoc(docRef);
	} catch (error) {
		console.error('Error deleting event planning contract:', error);
		throw new Error('Failed to delete event planning contract');
	}
}
