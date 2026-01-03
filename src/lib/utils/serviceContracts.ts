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
import { z } from 'zod';
import { db } from '$lib/config/firebase';
import { contractSchema, type ContractData } from '$lib/schemas/contract';

// Zod schema for validating service contract input before saving to Firebase
export const savedServiceContractInputSchema = z.object({
	contractData: contractSchema,
	contractNumber: z.string().min(1, 'Contract number is required'),
	ownerUid: z.string().min(1, 'Owner UID is required'),
	locationId: z.string().min(1, 'Location ID is required'),
	status: z.enum(['draft', 'generated']),
	paymentStatus: z.enum(['unpaid', 'paid']),
	paidAt: z.any().nullable(),
	paidBy: z.string().nullable(),
	createdAt: z.any().optional(),
	type: z.literal('service').default('service')
});

export interface SavedServiceContract {
	id: string;
	type: 'service';
	contractData: ContractData;
	contractNumber: string;
	createdAt: Timestamp;
	ownerUid: string;
	locationId: string;
	status: 'draft' | 'generated';
	paymentStatus: 'unpaid' | 'paid';
	paidAt: Timestamp | null;
	paidBy: string | null;
}

export interface SavedServiceContractInput
	extends Omit<SavedServiceContract, 'id' | 'createdAt'> {
	createdAt?: ReturnType<typeof serverTimestamp>;
}

const COLLECTION_NAME = 'service-contracts';

/**
 * Subscribe to service contracts (real-time updates)
 */
export function subscribeToServiceContracts(
	callback: (contracts: SavedServiceContract[]) => void,
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
					type: data.type || 'service',
					locationId: data.locationId || '',
					status: data.status || 'generated',
					paymentStatus: data.paymentStatus || 'unpaid',
					paidAt: data.paidAt || null,
					paidBy: data.paidBy || null
				} as SavedServiceContract;
			});
			callback(contracts);
		},
		(error) => {
			console.error('Error in service contracts subscription:', error);
			onError(error);
		}
	);
}

/**
 * Save a new service contract
 */
export async function saveServiceContract(
	ownerUid: string,
	contractData: ContractData,
	contractNumber: string,
	locationId: string,
	status: 'draft' | 'generated' = 'generated'
): Promise<string> {
	try {
		const contractInput: SavedServiceContractInput = {
			type: 'service',
			contractData,
			contractNumber,
			ownerUid,
			locationId,
			status,
			paymentStatus: 'unpaid',
			paidAt: null,
			paidBy: null,
			createdAt: serverTimestamp()
		};

		// Only validate fully for generated contracts, not drafts
		if (status === 'generated') {
			const validationResult = savedServiceContractInputSchema.safeParse(contractInput);
			if (!validationResult.success) {
				console.error('Validation error:', validationResult.error);
				throw new Error('Invalid contract data: ' + validationResult.error.message);
			}
		}

		const docRef = await addDoc(collection(db, COLLECTION_NAME), contractInput);
		return docRef.id;
	} catch (error) {
		console.error('Error saving service contract:', error);
		throw new Error('Failed to save service contract');
	}
}

/**
 * Get all service contracts ordered by creation date (newest first)
 */
export async function getServiceContracts(): Promise<SavedServiceContract[]> {
	try {
		const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));

		const querySnapshot = await getDocs(q);
		return querySnapshot.docs.map((doc) => {
			const data = doc.data();
			return {
				id: doc.id,
				...data,
				type: data.type || 'service',
				locationId: data.locationId || '',
				paymentStatus: data.paymentStatus || 'unpaid',
				paidAt: data.paidAt || null,
				paidBy: data.paidBy || null
			} as SavedServiceContract;
		});
	} catch (error) {
		console.error('Error fetching service contracts:', error);
		throw new Error('Failed to fetch service contracts');
	}
}

/**
 * Get a service contract by ID
 */
export async function getServiceContractById(contractId: string): Promise<SavedServiceContract | null> {
	try {
		const docRef = doc(db, COLLECTION_NAME, contractId);
		const docSnap = await getDoc(docRef);

		if (!docSnap.exists()) {
			return null;
		}

		const data = docSnap.data();

		return {
			id: docSnap.id,
			...data,
			type: data.type || 'service',
			locationId: data.locationId || '',
			status: data.status || 'generated',
			paymentStatus: data.paymentStatus || 'unpaid',
			paidAt: data.paidAt || null,
			paidBy: data.paidBy || null
		} as SavedServiceContract;
	} catch (error) {
		console.error('Error fetching service contract:', error);
		throw new Error('Failed to fetch service contract');
	}
}

/**
 * Update an existing service contract's data
 */
export async function updateServiceContract(
	contractId: string,
	contractData: ContractData
): Promise<void> {
	try {
		const docRef = doc(db, COLLECTION_NAME, contractId);

		const docSnap = await getDoc(docRef);
		if (!docSnap.exists()) {
			throw new Error('Service contract not found');
		}

		await updateDoc(docRef, {
			contractData,
			updatedAt: serverTimestamp()
		});
	} catch (error) {
		console.error('Error updating service contract:', error);
		throw new Error('Failed to update service contract');
	}
}

/**
 * Update payment status for a service contract (admin only)
 */
export async function updateServiceContractPaymentStatus(
	contractId: string,
	status: 'unpaid' | 'paid',
	adminUid: string
): Promise<void> {
	try {
		const docRef = doc(db, COLLECTION_NAME, contractId);

		const docSnap = await getDoc(docRef);
		if (!docSnap.exists()) {
			throw new Error('Service contract not found');
		}

		const updateData: {
			paymentStatus: 'unpaid' | 'paid';
			paidAt: ReturnType<typeof serverTimestamp> | null;
			paidBy: string | null;
			updatedAt: ReturnType<typeof serverTimestamp>;
		} = {
			paymentStatus: status,
			paidAt: status === 'paid' ? serverTimestamp() : null,
			paidBy: status === 'paid' ? adminUid : null,
			updatedAt: serverTimestamp()
		};

		await updateDoc(docRef, updateData);
	} catch (error) {
		console.error('Error updating payment status:', error);
		throw new Error('Failed to update payment status');
	}
}

/**
 * Get all service contracts for a specific location
 */
export async function getServiceContractsByLocationId(
	locationId: string
): Promise<SavedServiceContract[]> {
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
				paymentStatus: data.paymentStatus || 'unpaid',
				paidAt: data.paidAt || null,
				paidBy: data.paidBy || null
			} as SavedServiceContract;
		});
	} catch (error) {
		console.error('Error fetching service contracts by location:', error);
		throw new Error('Failed to fetch service contracts');
	}
}
