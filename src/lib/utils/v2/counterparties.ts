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
import type { Counterparty } from '$lib/types/v2';
import { counterpartySchema, type CounterpartyInput } from '$lib/schemas/v2';

const COLLECTION_NAME = 'counterparties';

/**
 * Subscribe to counterparties (real-time updates)
 */
export function subscribeToCounterparties(
	callback: (counterparties: Counterparty[]) => void,
	onError: (error: Error) => void
): Unsubscribe {
	const q = query(collection(db, COLLECTION_NAME), orderBy('name', 'asc'));

	return onSnapshot(
		q,
		(snapshot) => {
			const counterparties = snapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data()
			})) as Counterparty[];
			callback(counterparties);
		},
		(error) => {
			console.error('Error in counterparties subscription:', error);
			onError(error);
		}
	);
}

/**
 * Save a new counterparty
 */
export async function saveCounterparty(
	counterpartyData: CounterpartyInput
): Promise<string> {
	try {
		const validationResult = counterpartySchema.safeParse(counterpartyData);
		if (!validationResult.success) {
			console.error('Validation error:', validationResult.error);
			throw new Error('Invalid counterparty data: ' + validationResult.error.message);
		}

		const toWrite = {
			...counterpartyData,
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp()
		};

		const docRef = await addDoc(collection(db, COLLECTION_NAME), toWrite);
		return docRef.id;
	} catch (error) {
		console.error('Error saving counterparty:', error);
		throw new Error('Failed to save counterparty');
	}
}

/**
 * Get counterparty by ID
 */
export async function getCounterpartyById(counterpartyId: string): Promise<Counterparty | null> {
	try {
		const docRef = doc(db, COLLECTION_NAME, counterpartyId);
		const docSnap = await getDoc(docRef);

		if (!docSnap.exists()) {
			return null;
		}

		const data = docSnap.data();
		return {
			id: docSnap.id,
			...data
		} as Counterparty;
	} catch (error) {
		console.error('Error fetching counterparty:', error);
		throw new Error('Failed to fetch counterparty');
	}
}

/**
 * Get all counterparties
 */
export async function getCounterparties(): Promise<Counterparty[]> {
	try {
		const q = query(collection(db, COLLECTION_NAME), orderBy('name', 'asc'));
		const querySnapshot = await getDocs(q);
		
		return querySnapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data()
		})) as Counterparty[];
	} catch (error) {
		console.error('Error fetching counterparties:', error);
		throw new Error('Failed to fetch counterparties');
	}
}

/**
 * Get counterparties by type
 */
export async function getCounterpartiesByType(
	type: 'venue' | 'performer' | 'service-provider' | 'client' | 'supplier'
): Promise<Counterparty[]> {
	try {
		const q = query(
			collection(db, COLLECTION_NAME),
			where('type', '==', type),
			orderBy('name', 'asc')
		);

		const querySnapshot = await getDocs(q);
		return querySnapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data()
		})) as Counterparty[];
	} catch (error) {
		console.error('Error fetching counterparties by type:', error);
		throw new Error('Failed to fetch counterparties');
	}
}

/**
 * Get counterparties by owner
 */
export async function getCounterpartiesByOwner(ownerUid: string): Promise<Counterparty[]> {
	try {
		const q = query(
			collection(db, COLLECTION_NAME),
			where('ownerUid', '==', ownerUid),
			orderBy('name', 'asc')
		);

		const querySnapshot = await getDocs(q);
		return querySnapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data()
		})) as Counterparty[];
	} catch (error) {
		console.error('Error fetching counterparties by owner:', error);
		throw new Error('Failed to fetch counterparties');
	}
}

/**
 * Update counterparty
 */
export async function updateCounterparty(
	counterpartyId: string,
	updates: Partial<Counterparty>
): Promise<void> {
	try {
		const docRef = doc(db, COLLECTION_NAME, counterpartyId);

		const docSnap = await getDoc(docRef);
		if (!docSnap.exists()) {
			throw new Error('Counterparty not found');
		}

		await updateDoc(docRef, {
			...updates,
			updatedAt: serverTimestamp()
		});
	} catch (error) {
		console.error('Error updating counterparty:', error);
		throw new Error('Failed to update counterparty');
	}
}

/**
 * Delete counterparty
 */
export async function deleteCounterparty(counterpartyId: string): Promise<void> {
	try {
		const docRef = doc(db, COLLECTION_NAME, counterpartyId);
		await deleteDoc(docRef);
	} catch (error) {
		console.error('Error deleting counterparty:', error);
		throw new Error('Failed to delete counterparty');
	}
}

/**
 * Check if counterparty name already exists for owner
 */
export async function counterpartyNameExists(name: string, ownerUid: string): Promise<boolean> {
	try {
		const q = query(
			collection(db, COLLECTION_NAME),
			where('ownerUid', '==', ownerUid),
			where('name', '==', name)
		);

		const querySnapshot = await getDocs(q);
		return !querySnapshot.empty;
	} catch (error) {
		console.error('Error checking counterparty name:', error);
		return false;
	}
}
