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
import type { Counterparty, CounterpartyType, ContractorType } from '$lib/types/v2';
import {
	counterpartySchema,
	type CounterpartyInput,
	counterpartyListSchema,
	performerContractorSchema,
	serviceProviderContractorSchema,
	clientCounterpartySchema
} from '$lib/schemas/v2';
import { logger } from '../logger';

const COLLECTION_NAME = 'counterparties';

/**
 * Select the appropriate schema based on type and contractorType
 */
function getSchemaForData(data: Record<string, unknown>) {
	const type = data.type;
	if (type === 'client') {
		return clientCounterpartySchema;
	}
	if (type === 'contractor') {
		const contractorType = data.contractorType;
		if (contractorType === 'performer') {
			return performerContractorSchema;
		}
		if (contractorType === 'service-provider') {
			return serviceProviderContractorSchema;
		}
	}
	return null;
}

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
			const counterparties = snapshot.docs
				.map((docSnap) => {
					const data = docSnap.data();

					const result = counterpartyListSchema.safeParse(data);

					if (!result.success) {
						logger.error('Invalid counterparty data:', {
							id: docSnap.id,
							error: result.error.issues
						});
						return null;
					}

					return {
						id: docSnap.id,
						...result.data
					} as Counterparty;
				})
				.filter((c): c is Counterparty => c !== null);
			callback(counterparties);
		},
		(error) => {
			logger.error('Error in counterparties subscription:', error);
			onError(error);
		}
	);
}

/**
 * Save a new counterparty
 */
export async function saveCounterparty(counterpartyData: CounterpartyInput): Promise<string> {
	try {
		const validationResult = counterpartySchema.safeParse(counterpartyData);
		if (!validationResult.success) {
			logger.error('Validation error:', validationResult.error);
			throw new Error('Invalid counterparty data: ' + validationResult.error.message);
		}

		const toWrite = {
			...validationResult.data,
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp()
		};

		const docRef = await addDoc(collection(db, COLLECTION_NAME), toWrite);
		return docRef.id;
	} catch (error) {
		logger.error('Error saving counterparty:', error);
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

		const schema = getSchemaForData(data);
		if (!schema) {
			logger.error('Unknown counterparty type:', data.type, data.contractorType, counterpartyId);
			throw new Error(`Unknown counterparty type: ${data.type}/${data.contractorType}`);
		}

		const result = schema.safeParse(data);
		if (!result.success) {
			logger.error('Invalid counterparty data:', result.error, counterpartyId);
			throw new Error('Invalid counterparty data: ' + result.error.message);
		}

		return {
			id: docSnap.id,
			...result.data
		} as Counterparty;
	} catch (error) {
		logger.error('Error fetching counterparty:', error);
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

		return querySnapshot.docs
			.map((docSnap) => {
				const data = docSnap.data();

				const schema = getSchemaForData(data);
				if (!schema) {
					logger.error('Unknown counterparty type:', data.type, data.contractorType, docSnap.id);
					return null;
				}

				const result = schema.safeParse(data);
				if (!result.success) {
					logger.error('Invalid counterparty data:', {
						id: docSnap.id,
						type: data.type,
						error: result.error.issues
					});
					return null;
				}

				return {
					id: docSnap.id,
					...result.data
				} as Counterparty;
			})
			.filter((c): c is Counterparty => c !== null);
	} catch (error) {
		logger.error('Error fetching counterparties:', error);
		throw new Error('Failed to fetch counterparties');
	}
}

/**
 * Get counterparties by top-level type
 */
export async function getCounterpartiesByType(
	type: CounterpartyType,
	contractorType?: ContractorType
): Promise<Counterparty[]> {
	try {
		const constraints = [
			where('type', '==', type),
			orderBy('name', 'asc')
		];

		if (contractorType) {
			constraints.splice(1, 0, where('contractorType', '==', contractorType));
		}

		const q = query(collection(db, COLLECTION_NAME), ...constraints);
		const querySnapshot = await getDocs(q);

		return querySnapshot.docs
			.map((docSnap) => {
				const data = docSnap.data();

				const schema = getSchemaForData(data);
				if (!schema) {
					logger.error('Unknown counterparty type:', data.type, data.contractorType, docSnap.id);
					return null;
				}

				const result = schema.safeParse(data);
				if (!result.success) {
					logger.error('Invalid counterparty data:', result.error, docSnap.id);
					return null;
				}

				return {
					id: docSnap.id,
					...result.data
				} as Counterparty;
			})
			.filter((c): c is Counterparty => c !== null);
	} catch (error) {
		logger.error('Error fetching counterparties by type:', error);
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

		return querySnapshot.docs
			.map((docSnap) => {
				const data = docSnap.data();

				const result = counterpartyListSchema.safeParse(data);

				if (!result.success) {
					logger.error('Invalid counterparty data:', {
						id: docSnap.id,
						error: result.error.issues
					});
					return null;
				}

				return {
					id: docSnap.id,
					...result.data
				} as Counterparty;
			})
			.filter((c): c is Counterparty => c !== null);
	} catch (error) {
		logger.error('Error fetching counterparties by owner:', error);
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

		const toWrite = {
			...updates,
			updatedAt: serverTimestamp()
		};

		await updateDoc(docRef, toWrite);
	} catch (error) {
		logger.error('Error updating counterparty:', error);
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
		logger.error('Error deleting counterparty:', error);
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
		logger.error('Error checking counterparty name:', error);
		return false;
	}
}
