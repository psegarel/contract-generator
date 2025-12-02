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
 * Get all contracts for all authenticated users
 */
export async function getAllContracts(): Promise<SavedContract[]> {
	try {
		const q = query(collection(db, 'contracts'), orderBy('createdAt', 'desc'));

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

/**
 * Get a single contract by ID
 */
export async function getContract(contractId: string): Promise<SavedContract | null> {
	try {
		const docRef = doc(db, 'contracts', contractId);
		const docSnap = await getDoc(docRef);

		if (!docSnap.exists()) {
			return null;
		}

		const data = docSnap.data();

		return {
			id: docSnap.id,
			...data
		} as SavedContract;
	} catch (error) {
		console.error('Error fetching contract:', error);
		throw new Error('Failed to fetch contract');
	}
}

/**
 * Update an existing contract
 */
export async function updateContract(
	contractId: string,
	contractData: ContractData
): Promise<void> {
	try {
		const docRef = doc(db, 'contracts', contractId);

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
