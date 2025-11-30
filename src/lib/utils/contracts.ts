import {
	collection,
	addDoc,
	getDocs,
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
	type: 'service'; // For now, only service contracts
	contractData: ContractData;
	contractNumber: string;
	createdAt: Timestamp;
	ownerUid: string;
}

export interface SavedContractInput extends Omit<SavedContract, 'id' | 'createdAt'> {
	createdAt?: ReturnType<typeof serverTimestamp>;
}

/**
 * Save a contract to Firestore
 */
export async function saveContract(
	ownerUid: string,
	contractType: 'service',
	contractData: ContractData,
	contractNumber: string
): Promise<string> {
	try {
		const contractInput: SavedContractInput = {
			type: contractType,
			contractData,
			contractNumber,
			ownerUid,
			createdAt: serverTimestamp()
		};

		const docRef = await addDoc(collection(db, 'contracts'), contractInput);
		return docRef.id;
	} catch (error) {
		console.error('Error saving contract:', error);
		throw new Error('Failed to save contract');
	}
}

/**
 * Get all contracts for a user
 */
export async function getUserContracts(ownerUid: string): Promise<SavedContract[]> {
	try {
		const q = query(
			collection(db, 'contracts'),
			where('ownerUid', '==', ownerUid),
			orderBy('createdAt', 'desc')
		);

		const querySnapshot = await getDocs(q);
		return querySnapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data()
		})) as SavedContract[];
	} catch (error) {
		console.error('Error fetching contracts:', error);
		throw new Error('Failed to fetch contracts');
	}
}
