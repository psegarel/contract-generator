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
	type Timestamp,
	serverTimestamp,
	onSnapshot,
	type Unsubscribe
} from 'firebase/firestore';
import { db } from '$lib/config/firebase';
import type { EventPlanningContractData } from '$lib/schemas/eventPlanningContract';

export interface SavedEventPlanningContract {
	id: string;
	type: 'event-planning';
	contractData: EventPlanningContractData;
	contractNumber: string;
	createdAt: Timestamp;
	ownerUid: string;
	locationId: string;
	paymentDirection: 'receivable' | 'payable'; // receivable = client pays us, payable = we pay vendor
	paymentStatus: 'unpaid' | 'paid';
	paidAt: Timestamp | null;
	paidBy: string | null;
}

export interface SavedEventPlanningContractInput
	extends Omit<SavedEventPlanningContract, 'id' | 'createdAt'> {
	createdAt?: ReturnType<typeof serverTimestamp>;
}

const COLLECTION_NAME = 'event-planning-contracts';

/**
 * Subscribe to event planning contracts (real-time updates)
 */
export function subscribeToEventPlanningContracts(
	callback: (contracts: SavedEventPlanningContract[]) => void,
	onError: (error: Error) => void
): Unsubscribe {
	const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));

	return onSnapshot(
		q,
		(snapshot) => {
			const contracts = snapshot.docs.map((doc) => {
				const data = doc.data();
				return {
					id: doc.id,
					...data,
					type: data.type || 'event-planning',
					locationId: data.locationId || '',
					paymentDirection: data.paymentDirection || 'receivable',
					paymentStatus: data.paymentStatus || 'unpaid',
					paidAt: data.paidAt || null,
					paidBy: data.paidBy || null
				} as SavedEventPlanningContract;
			});
			callback(contracts);
		},
		(error) => {
			console.error('Error in contracts subscription:', error);
			onError(error);
		}
	);
}

export async function saveEventPlanningContract(
	ownerUid: string,
	contractData: EventPlanningContractData,
	contractNumber: string,
	locationId: string,
	paymentDirection: 'receivable' | 'payable' = 'receivable'
): Promise<string> {
	try {
		const contractInput: SavedEventPlanningContractInput = {
			type: 'event-planning',
			contractData,
			contractNumber,
			ownerUid,
			locationId,
			paymentDirection,
			paymentStatus: 'unpaid',
			paidAt: null,
			paidBy: null,
			createdAt: serverTimestamp()
		};

		const docRef = await addDoc(collection(db, COLLECTION_NAME), contractInput);
		return docRef.id;
	} catch (error) {
		console.error('Error saving event planning contract:', error);
		throw new Error('Failed to save event planning contract');
	}
}

/**
 * Get all event planning contracts ordered by creation date (newest first)
 */
export async function getEventPlanningContracts(): Promise<SavedEventPlanningContract[]> {
	try {
		const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));

		const querySnapshot = await getDocs(q);
		return querySnapshot.docs.map((doc) => {
			const data = doc.data();
			return {
				id: doc.id,
				...data,
				type: data.type || 'event-planning',
				locationId: data.locationId || '',
				paymentDirection: data.paymentDirection || 'receivable',
				paymentStatus: data.paymentStatus || 'unpaid',
				paidAt: data.paidAt || null,
				paidBy: data.paidBy || null
			} as SavedEventPlanningContract;
		});
	} catch (error) {
		console.error('Error getting event planning contracts:', error);
		throw new Error('Failed to get event planning contracts');
	}
}

/**
 * Get a specific event planning contract by ID
 */
export async function getEventPlanningContractById(
	contractId: string
): Promise<SavedEventPlanningContract | null> {
	try {
		const docRef = doc(db, COLLECTION_NAME, contractId);
		const docSnap = await getDoc(docRef);

		if (docSnap.exists()) {
			const data = docSnap.data();
			return {
				id: docSnap.id,
				...data,
				type: data.type || 'event-planning',
				locationId: data.locationId || '',
				paymentDirection: data.paymentDirection || 'receivable',
				paymentStatus: data.paymentStatus || 'unpaid',
				paidAt: data.paidAt || null,
				paidBy: data.paidBy || null
			} as SavedEventPlanningContract;
		} else {
			return null;
		}
	} catch (error) {
		console.error('Error getting event planning contract:', error);
		throw new Error('Failed to get event planning contract');
	}
}

/**
 * Update an event planning contract
 */
export async function updateEventPlanningContract(
	contractId: string,
	contractData: EventPlanningContractData
): Promise<void> {
	try {
		const docRef = doc(db, COLLECTION_NAME, contractId);
		await updateDoc(docRef, {
			contractData
		});
	} catch (error) {
		console.error('Error updating event planning contract:', error);
		throw new Error('Failed to update event planning contract');
	}
}

/**
 * Update payment status of an event planning contract
 */
export async function updateEventPlanningContractPaymentStatus(
	contractId: string,
	status: 'unpaid' | 'paid',
	adminUid: string
): Promise<void> {
	try {
		const docRef = doc(db, COLLECTION_NAME, contractId);
		await updateDoc(docRef, {
			paymentStatus: status,
			paidAt: status === 'paid' ? serverTimestamp() : null,
			paidBy: status === 'paid' ? adminUid : null
		});
	} catch (error) {
		console.error('Error updating event planning contract payment status:', error);
		throw new Error('Failed to update payment status');
	}
}

/**
 * Get event planning contracts by location ID
 */
export async function getEventPlanningContractsByLocationId(
	locationId: string
): Promise<SavedEventPlanningContract[]> {
	try {
		const q = query(
			collection(db, COLLECTION_NAME),
			where('locationId', '==', locationId),
			orderBy('createdAt', 'desc')
		);

		const querySnapshot = await getDocs(q);
		return querySnapshot.docs.map((doc) => {
			const data = doc.data();
			return {
				id: doc.id,
				...data,
				locationId: data.locationId || '',
				paymentDirection: data.paymentDirection || 'receivable',
				paymentStatus: data.paymentStatus || 'unpaid',
				paidAt: data.paidAt || null,
				paidBy: data.paidBy || null
			} as SavedEventPlanningContract;
		});
	} catch (error) {
		console.error('Error getting event planning contracts by location:', error);
		throw new Error('Failed to get event planning contracts');
	}
}
