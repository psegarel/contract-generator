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
import type { VenueRentalContract } from '$lib/types/v2';
import { venueRentalContractInputSchema } from '$lib/schemas/v2';
import { logger } from '../logger';

const COLLECTION_NAME = 'venue-rental-contracts';

/**
 * Subscribe to venue rental contracts (real-time updates)
 */
export function subscribeToVenueRentalContracts(
	callback: (contracts: VenueRentalContract[]) => void,
	onError: (error: Error) => void
): Unsubscribe {
	const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));

	return onSnapshot(
		q,
		(snapshot) => {
			const contracts = snapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data()
			})) as VenueRentalContract[];
			callback(contracts);
		},
		(error) => {
			logger.error('Error in venue rental contracts subscription:', error);
			onError(error);
		}
	);
}

/**
 * Save a new venue rental contract
 */
export async function saveVenueRentalContract(
	contractData: Omit<VenueRentalContract, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
	try {
		// Validate with schema
		const validationResult = venueRentalContractInputSchema.safeParse(contractData);
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
		logger.error('Error saving venue rental contract:', error);
		throw new Error('Failed to save venue rental contract');
	}
}

/**
 * Get venue rental contract by ID
 */
export async function getVenueRentalContractById(
	contractId: string
): Promise<VenueRentalContract | null> {
	try {
		const docRef = doc(db, COLLECTION_NAME, contractId);
		const docSnap = await getDoc(docRef);

		if (!docSnap.exists()) {
			return null;
		}

		return {
			id: docSnap.id,
			...docSnap.data()
		} as VenueRentalContract;
	} catch (error) {
		logger.error('Error fetching venue rental contract:', error);
		throw new Error('Failed to fetch venue rental contract');
	}
}

/**
 * Get all venue rental contracts
 */
export async function getVenueRentalContracts(): Promise<VenueRentalContract[]> {
	try {
		const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
		const querySnapshot = await getDocs(q);

		return querySnapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data()
		})) as VenueRentalContract[];
	} catch (error) {
		logger.error('Error fetching venue rental contracts:', error);
		throw new Error('Failed to fetch venue rental contracts');
	}
}

/**
 * Get venue rental contracts by event ID
 */
export async function getVenueRentalContractsByEventId(
	eventId: string
): Promise<VenueRentalContract[]> {
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
		})) as VenueRentalContract[];
	} catch (error) {
		logger.error('Error fetching venue rental contracts by event:', error);
		throw new Error('Failed to fetch venue rental contracts');
	}
}

/**
 * Update payment status for a venue rental contract
 */
export async function updateVenueRentalContractPaymentStatus(
	contractId: string,
	status: 'unpaid' | 'paid',
	adminUid: string
): Promise<void> {
	try {
		const docRef = doc(db, COLLECTION_NAME, contractId);

		const docSnap = await getDoc(docRef);
		if (!docSnap.exists()) {
			throw new Error('Venue rental contract not found');
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
 * Delete venue rental contract
 */
export async function deleteVenueRentalContract(contractId: string): Promise<void> {
	try {
		const docRef = doc(db, COLLECTION_NAME, contractId);
		await deleteDoc(docRef);
	} catch (error) {
		logger.error('Error deleting venue rental contract:', error);
		throw new Error('Failed to delete venue rental contract');
	}
}
