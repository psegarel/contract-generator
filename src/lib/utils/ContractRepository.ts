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
	serverTimestamp
} from 'firebase/firestore';
import { db } from '$lib/config/firebase';
import type { ContractData } from '$lib/schemas/contract';

export interface SavedContract {
	id: string;
	type: 'service';
	contractData: ContractData;
	contractNumber: string;
	createdAt: Timestamp;
	ownerUid: string;
	locationId: string; // Reference to location in locations collection
	paymentStatus: 'unpaid' | 'paid'; // Payment tracking
	paidAt: Timestamp | null; // When payment was marked as paid
	paidBy: string | null; // UID of admin who marked as paid
}

export interface SavedContractInput extends Omit<SavedContract, 'id' | 'createdAt'> {
	createdAt?: ReturnType<typeof serverTimestamp>;
}

/**
 * Repository for managing contracts in Firestore
 */
export class ContractRepository {
	private static readonly COLLECTION_NAME = 'contracts';

	/**
	 * Save a new contract
	 */
	async save(
		ownerUid: string,
		contractType: 'service',
		contractData: ContractData,
		contractNumber: string,
		locationId: string
	): Promise<string> {
		try {
			const contractInput: SavedContractInput = {
				type: contractType,
				contractData,
				contractNumber,
				ownerUid,
				locationId,
				paymentStatus: 'unpaid', // Default to unpaid
				paidAt: null,
				paidBy: null,
				createdAt: serverTimestamp()
			};

			const docRef = await addDoc(collection(db, ContractRepository.COLLECTION_NAME), contractInput);
			return docRef.id;
		} catch (error) {
			console.error('Error saving contract:', error);
			throw new Error('Failed to save contract');
		}
	}

	/**
	 * Get all contracts ordered by creation date (newest first)
	 */
	async getAll(): Promise<SavedContract[]> {
		try {
			const q = query(
				collection(db, ContractRepository.COLLECTION_NAME),
				orderBy('createdAt', 'desc')
			);

			const querySnapshot = await getDocs(q);
			return querySnapshot.docs.map((doc) => {
				const data = doc.data();
				return {
					id: doc.id,
					...data,
					// Provide defaults for lazy migration
					locationId: data.locationId || '',
					paymentStatus: data.paymentStatus || 'unpaid',
					paidAt: data.paidAt || null,
					paidBy: data.paidBy || null
				} as SavedContract;
			});
		} catch (error) {
			console.error('Error fetching contracts:', error);
			throw new Error('Failed to fetch contracts');
		}
	}

	/**
	 * Get a contract by ID
	 */
	async getById(contractId: string): Promise<SavedContract | null> {
		try {
			const docRef = doc(db, ContractRepository.COLLECTION_NAME, contractId);
			const docSnap = await getDoc(docRef);

			if (!docSnap.exists()) {
				return null;
			}

			const data = docSnap.data();

			return {
				id: docSnap.id,
				...data,
				// Provide defaults for lazy migration
				locationId: data.locationId || '',
				paymentStatus: data.paymentStatus || 'unpaid',
				paidAt: data.paidAt || null,
				paidBy: data.paidBy || null
			} as SavedContract;
		} catch (error) {
			console.error('Error fetching contract:', error);
			throw new Error('Failed to fetch contract');
		}
	}

	/**
	 * Update an existing contract's data
	 */
	async update(contractId: string, contractData: ContractData): Promise<void> {
		try {
			const docRef = doc(db, ContractRepository.COLLECTION_NAME, contractId);

			// Verify the contract exists
			const docSnap = await getDoc(docRef);
			if (!docSnap.exists()) {
				throw new Error('Contract not found');
			}

			await updateDoc(docRef, {
				contractData,
				updatedAt: serverTimestamp()
			});
		} catch (error) {
			console.error('Error updating contract:', error);
			throw new Error('Failed to update contract');
		}
	}

	/**
	 * Update payment status for a contract (admin only)
	 */
	async updatePaymentStatus(
		contractId: string,
		status: 'unpaid' | 'paid',
		adminUid: string
	): Promise<void> {
		try {
			const docRef = doc(db, ContractRepository.COLLECTION_NAME, contractId);

			// Verify the contract exists
			const docSnap = await getDoc(docRef);
			if (!docSnap.exists()) {
				throw new Error('Contract not found');
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
	 * Get all contracts for a specific location
	 */
	async getByLocationId(locationId: string): Promise<SavedContract[]> {
		try {
			const q = query(
				collection(db, ContractRepository.COLLECTION_NAME),
				where('locationId', '==', locationId),
				orderBy('createdAt', 'desc')
			);

			const querySnapshot = await getDocs(q);
			return querySnapshot.docs.map((doc) => {
				const data = doc.data();
				return {
					id: doc.id,
					...data,
					// Provide defaults for lazy migration
					locationId: data.locationId || '',
					paymentStatus: data.paymentStatus || 'unpaid',
					paidAt: data.paidAt || null,
					paidBy: data.paidBy || null
				} as SavedContract;
			});
		} catch (error) {
			console.error('Error fetching contracts by location:', error);
			throw new Error('Failed to fetch contracts');
		}
	}
}
