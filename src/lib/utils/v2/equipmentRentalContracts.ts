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
import type { EquipmentRentalContract } from '$lib/types/v2';
import {
	equipmentRentalContractInputSchema,
	type EquipmentRentalContractInput
} from '$lib/schemas/v2';
import { logger } from '../logger';

const COLLECTION_NAME = 'equipment-rental-contracts';

/**
 * Subscribe to equipment rental contracts (real-time updates)
 */
export function subscribeToEquipmentRentalContracts(
	callback: (contracts: EquipmentRentalContract[]) => void,
	onError: (error: Error) => void
): Unsubscribe {
	const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));

	return onSnapshot(
		q,
		(snapshot) => {
			const contracts = snapshot.docs.map((doc) => {
				const data = doc.data();
				const migratedData = migrateContractData(data);
				return {
					id: doc.id,
					...migratedData
				};
			}) as EquipmentRentalContract[];
			callback(contracts);
		},
		(error) => {
			logger.error('Error in equipment rental contracts subscription:', error);
			onError(error);
		}
	);
}

/**
 * Save a new equipment rental contract
 */
export async function saveEquipmentRentalContract(
	contractData: EquipmentRentalContractInput
): Promise<string> {
	try {
		// Validate with schema
		const validationResult = equipmentRentalContractInputSchema.safeParse(contractData);
		if (!validationResult.success) {
			logger.error('Validation error:', validationResult.error);
			throw new Error('Invalid contract data: ' + validationResult.error.message);
		}

		// Convert null/undefined values to empty strings for Firestore compatibility
		// Note: eventId and eventName can be null for standalone contracts
		const toWrite = {
			...contractData,
			eventId: contractData.eventId || null, // Keep null if no event (standalone)
			eventName: contractData.eventName || null, // Keep null if no event (standalone)
			venueName: contractData.venueName || '',
			venueNameEnglish: contractData.venueNameEnglish || '',
			venueAddress: contractData.venueAddress || '',
			venueAddressEnglish: contractData.venueAddressEnglish || '',
			notes: contractData.notes || '',
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp()
		};

		const docRef = await addDoc(collection(db, COLLECTION_NAME), toWrite);
		return docRef.id;
	} catch (error) {
		logger.error('Error saving equipment rental contract:', error);
		throw new Error('Failed to save equipment rental contract');
	}
}

/**
 * Migrate old contract format to new format (backward compatibility)
 * - Converts pickupLocation/returnLocation to equipmentLocation
 * - Converts single venueAddress to venueAddressVietnamese/venueAddressEnglish
 * - Ensures venueName is always a string
 */
function migrateContractData(data: any): any {
	const migrated = { ...data };

	// Migrate pickupLocation/returnLocation → equipmentLocation
	if (migrated.equipmentLocation === undefined) {
		migrated.equipmentLocation = data.pickupLocation || data.returnLocation || '';
		migrated.pickupLocation = undefined;
		migrated.returnLocation = undefined;
	}

	// Ensure venue fields exist (old docs may lack the English variants)
	migrated.venueName = migrated.venueName || '';
	migrated.venueNameEnglish = migrated.venueNameEnglish || migrated.venueName;
	migrated.venueAddress = migrated.venueAddress || '';
	migrated.venueAddressEnglish = migrated.venueAddressEnglish || migrated.venueAddress;

	// Ensure monthlyRent exists (new field, defaults to 0 for legacy contracts)
	if (migrated.monthlyRent === undefined) {
		migrated.monthlyRent = 0;
	}

	return migrated;
}

/**
 * Get equipment rental contract by ID
 */
export async function getEquipmentRentalContractById(
	contractId: string
): Promise<EquipmentRentalContract | null> {
	try {
		const docRef = doc(db, COLLECTION_NAME, contractId);
		const docSnap = await getDoc(docRef);

		if (!docSnap.exists()) {
			return null;
		}

		const data = docSnap.data();
		const migratedData = migrateContractData(data);

		return {
			id: docSnap.id,
			...migratedData
		} as EquipmentRentalContract;
	} catch (error) {
		logger.error('Error fetching equipment rental contract:', error);
		throw new Error('Failed to fetch equipment rental contract');
	}
}

/**
 * Get all equipment rental contracts
 */
export async function getEquipmentRentalContracts(): Promise<EquipmentRentalContract[]> {
	try {
		const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
		const querySnapshot = await getDocs(q);

		return querySnapshot.docs.map((doc) => {
			const data = doc.data();
			const migratedData = migrateContractData(data);
			return {
				id: doc.id,
				...migratedData
			};
		}) as EquipmentRentalContract[];
	} catch (error) {
		logger.error('Error fetching equipment rental contracts:', error);
		throw new Error('Failed to fetch equipment rental contracts');
	}
}

/**
 * Get equipment rental contracts by event ID
 */
export async function getEquipmentRentalContractsByEventId(
	eventId: string
): Promise<EquipmentRentalContract[]> {
	try {
		const q = query(
			collection(db, COLLECTION_NAME),
			where('eventId', '==', eventId),
			orderBy('createdAt', 'desc')
		);

		const querySnapshot = await getDocs(q);
		return querySnapshot.docs.map((doc) => {
			const data = doc.data();
			const migratedData = migrateContractData(data);
			return {
				id: doc.id,
				...migratedData
			};
		}) as EquipmentRentalContract[];
	} catch (error) {
		logger.error('Error fetching equipment rental contracts by event:', error);
		throw new Error('Failed to fetch equipment rental contracts');
	}
}

/**
 * Update payment status for an equipment rental contract
 */
export async function updateEquipmentRentalContractPaymentStatus(
	contractId: string,
	status: 'unpaid' | 'paid',
	adminUid: string
): Promise<void> {
	try {
		const docRef = doc(db, COLLECTION_NAME, contractId);

		const docSnap = await getDoc(docRef);
		if (!docSnap.exists()) {
			throw new Error('Equipment rental contract not found');
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
 * Update contract data (for editing)
 */
export async function updateEquipmentRentalContract(
	contractId: string,
	updates: EquipmentRentalContractInput
): Promise<void> {
	try {
		const docRef = doc(db, COLLECTION_NAME, contractId);

		const docSnap = await getDoc(docRef);
		if (!docSnap.exists()) {
			throw new Error('Equipment rental contract not found');
		}

		// Convert null/undefined values appropriately for Firestore compatibility
		// Note: eventId and eventName can be null for standalone contracts
		const toUpdate = {
			...updates,
			eventId: updates.eventId ?? null, // Keep null if no event (standalone)
			eventName: updates.eventName ?? null, // Keep null if no event (standalone)
			venueName: updates.venueName ?? '',
			venueNameEnglish: updates.venueNameEnglish ?? '',
			venueAddress: updates.venueAddress ?? '',
			venueAddressEnglish: updates.venueAddressEnglish ?? '',
			notes: updates.notes ?? '',
			updatedAt: serverTimestamp()
		};

		await updateDoc(docRef, toUpdate);
	} catch (error) {
		logger.error('Error updating equipment rental contract:', error);
		throw new Error('Failed to update equipment rental contract');
	}
}

/**
 * Delete equipment rental contract
 */
export async function deleteEquipmentRentalContract(contractId: string): Promise<void> {
	try {
		const docRef = doc(db, COLLECTION_NAME, contractId);
		await deleteDoc(docRef);
	} catch (error) {
		logger.error('Error deleting equipment rental contract:', error);
		throw new Error('Failed to delete equipment rental contract');
	}
}
