import {
	collection,
	addDoc,
	getDoc,
	doc,
	updateDoc,
	orderBy,
	serverTimestamp,
	onSnapshot,
	deleteDoc,
	query,
	type Unsubscribe
} from 'firebase/firestore';
import { db } from '$lib/config/firebase';
import type { EquipmentRentalOneOffContract } from '$lib/types/v2';
import {
	equipmentRentalOneOffContractInputSchema,
	type EquipmentRentalOneOffContractInput
} from '$lib/schemas/v2';
import { logger } from '../logger';

const COLLECTION_NAME = 'equipment-rental-oneoff-contracts';

/**
 * Subscribe to equipment rental one-off contracts (real-time updates)
 */
export function subscribeToEquipmentRentalOneOffContracts(
	callback: (contracts: EquipmentRentalOneOffContract[]) => void,
	onError: (error: Error) => void
): Unsubscribe {
	const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));

	return onSnapshot(
		q,
		(snapshot) => {
			const contracts = snapshot.docs.map((docSnap) => ({
				id: docSnap.id,
				...docSnap.data()
			})) as EquipmentRentalOneOffContract[];
			callback(contracts);
		},
		(error) => {
			logger.error('Error in equipment rental one-off contracts subscription:', error);
			onError(error);
		}
	);
}

/**
 * Save a new equipment rental one-off contract
 */
export async function saveEquipmentRentalOneOffContract(
	contractData: EquipmentRentalOneOffContractInput
): Promise<string> {
	const validationResult = equipmentRentalOneOffContractInputSchema.safeParse(contractData);
	if (!validationResult.success) {
		logger.error('Validation error:', validationResult.error);
		throw new Error('Invalid contract data: ' + validationResult.error.message);
	}

	const toWrite = {
		...validationResult.data,
		eventId: validationResult.data.eventId || null,
		notes: validationResult.data.notes || null,
		createdAt: serverTimestamp(),
		updatedAt: serverTimestamp()
	};

	const docRef = await addDoc(collection(db, COLLECTION_NAME), toWrite);
	return docRef.id;
}

/**
 * Get equipment rental one-off contract by ID
 */
export async function getEquipmentRentalOneOffContractById(
	contractId: string
): Promise<EquipmentRentalOneOffContract | null> {
	const docRef = doc(db, COLLECTION_NAME, contractId);
	const docSnap = await getDoc(docRef);

	if (!docSnap.exists()) {
		return null;
	}

	return {
		id: docSnap.id,
		...docSnap.data()
	} as EquipmentRentalOneOffContract;
}

/**
 * Update contract data (for editing)
 */
export async function updateEquipmentRentalOneOffContract(
	contractId: string,
	updates: EquipmentRentalOneOffContractInput
): Promise<void> {
	const docRef = doc(db, COLLECTION_NAME, contractId);

	const docSnap = await getDoc(docRef);
	if (!docSnap.exists()) {
		throw new Error('Equipment rental one-off contract not found');
	}

	const toUpdate = {
		...updates,
		eventId: updates.eventId ?? null,
		notes: updates.notes ?? null,
		updatedAt: serverTimestamp()
	};

	await updateDoc(docRef, toUpdate);
}

/**
 * Update payment status
 */
export async function updateEquipmentRentalOneOffContractPaymentStatus(
	contractId: string,
	status: 'unpaid' | 'paid',
	adminUid: string
): Promise<void> {
	const docRef = doc(db, COLLECTION_NAME, contractId);

	const docSnap = await getDoc(docRef);
	if (!docSnap.exists()) {
		throw new Error('Equipment rental one-off contract not found');
	}

	await updateDoc(docRef, {
		paymentStatus: status,
		paidAt: status === 'paid' ? serverTimestamp() : null,
		paidBy: status === 'paid' ? adminUid : null,
		updatedAt: serverTimestamp()
	});
}

/**
 * Delete equipment rental one-off contract
 */
export async function deleteEquipmentRentalOneOffContract(contractId: string): Promise<void> {
	const docRef = doc(db, COLLECTION_NAME, contractId);
	await deleteDoc(docRef);
}
