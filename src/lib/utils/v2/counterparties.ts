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
	type Unsubscribe,
	Timestamp
} from 'firebase/firestore';
import { db } from '$lib/config/firebase';
import type { Counterparty } from '$lib/types/v2';
import {
	counterpartySchema,
	type CounterpartyInput,
	counterpartyListSchema,
	venueCounterpartySchema,
	performerCounterpartySchema,
	serviceProviderCounterpartySchema,
	clientCounterpartySchema,
	supplierCounterpartySchema
} from '$lib/schemas/v2';

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
			const counterparties = snapshot.docs
				.map((doc) => {
					const data = doc.data();

					// Use list schema (only validates common fields, ignores type-specific fields)
					const result = counterpartyListSchema.safeParse(data);

					if (!result.success) {
						console.error('Invalid counterparty data:', {
							id: doc.id,
							error: result.error.format()
						});
						return null;
					}

					// Return validated data
					return {
						id: doc.id,
						...result.data
					} as Counterparty;
				})
				.filter((c): c is Counterparty => c !== null);
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
export async function saveCounterparty(counterpartyData: CounterpartyInput): Promise<string> {
	try {
		// Validate complete data (timestamps from form are present)
		const validationResult = counterpartySchema.safeParse(counterpartyData);
		if (!validationResult.success) {
			console.error('Validation error:', validationResult.error);
			throw new Error('Invalid counterparty data: ' + validationResult.error.message);
		}

		// Write to Firestore, replacing form timestamps with serverTimestamp() (server is source of truth)
		const toWrite = {
			...validationResult.data,
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

		// Check type first to use the correct schema
		if (!data.type || typeof data.type !== 'string') {
			console.error('Counterparty type is missing or invalid:', data.type, counterpartyId);
			throw new Error('Counterparty type is missing');
		}

		// Normalize type (trim whitespace, lowercase)
		const normalizedType = data.type.trim().toLowerCase();

		// Select the appropriate schema based on type
		let result;
		switch (normalizedType) {
			case 'venue':
				result = venueCounterpartySchema.safeParse(data);
				break;
			case 'performer':
				result = performerCounterpartySchema.safeParse(data);
				break;
			case 'service-provider':
				result = serviceProviderCounterpartySchema.safeParse(data);
				break;
			case 'client':
				result = clientCounterpartySchema.safeParse(data);
				break;
			case 'supplier':
				result = supplierCounterpartySchema.safeParse(data);
				break;
			default:
				console.error(
					'Unknown counterparty type:',
					normalizedType,
					'original:',
					data.type,
					counterpartyId
				);
				throw new Error(`Unknown counterparty type: ${normalizedType}`);
		}

		if (!result.success) {
			console.error('Invalid counterparty data:', result.error, counterpartyId);
			throw new Error('Invalid counterparty data: ' + result.error.message);
		}

		// Return validated data
		return {
			id: docSnap.id,
			...result.data
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

		return querySnapshot.docs
			.map((doc) => {
				const data = doc.data();

				// Check type first to use the correct schema
				if (!data.type || typeof data.type !== 'string') {
					console.error('Counterparty type is missing:', doc.id);
					return null;
				}

				// Normalize type (trim whitespace, lowercase)
				const normalizedType = data.type.trim().toLowerCase();

				// Select the appropriate schema based on type
				let result;
				switch (normalizedType) {
					case 'venue':
						result = venueCounterpartySchema.safeParse(data);
						break;
					case 'performer':
						result = performerCounterpartySchema.safeParse(data);
						break;
					case 'service-provider':
						result = serviceProviderCounterpartySchema.safeParse(data);
						break;
					case 'client':
						result = clientCounterpartySchema.safeParse(data);
						break;
					case 'supplier':
						result = supplierCounterpartySchema.safeParse(data);
						break;
					default:
						console.error(
							'Unknown counterparty type:',
							normalizedType,
							'original:',
							data.type,
							doc.id
						);
						return null;
				}

				if (!result.success) {
					console.error('Invalid counterparty data:', {
						id: doc.id,
						type: normalizedType,
						error: result.error.format(),
						issues: result.error.issues.map((issue) => ({
							path: issue.path.join('.'),
							message: issue.message,
							code: issue.code
						}))
					});
					return null;
				}

				// Return validated data
				return {
					id: doc.id,
					...result.data
				} as Counterparty;
			})
			.filter((c): c is Counterparty => c !== null);
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

		// Select the appropriate schema for this type
		let schema;
		switch (type) {
			case 'venue':
				schema = venueCounterpartySchema;
				break;
			case 'performer':
				schema = performerCounterpartySchema;
				break;
			case 'service-provider':
				schema = serviceProviderCounterpartySchema;
				break;
			case 'client':
				schema = clientCounterpartySchema;
				break;
			case 'supplier':
				schema = supplierCounterpartySchema;
				break;
			default:
				throw new Error(`Unknown counterparty type: ${type}`);
		}

		return querySnapshot.docs
			.map((doc) => {
				const data = doc.data();
				const result = schema.safeParse(data);

				if (!result.success) {
					console.error('Invalid counterparty data:', result.error, doc.id);
					return null;
				}

				return {
					id: doc.id,
					...result.data
				} as Counterparty;
			})
			.filter((c): c is Counterparty => c !== null);
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

		return querySnapshot.docs
			.map((doc) => {
				const data = doc.data();

				// Use list schema (only validates common fields, ignores type-specific fields)
				const result = counterpartyListSchema.safeParse(data);

				if (!result.success) {
					console.error('Invalid counterparty data:', {
						id: doc.id,
						error: result.error.format()
					});
					return null;
				}

				// Return validated data
				return {
					id: doc.id,
					...result.data
				} as Counterparty;
			})
			.filter((c): c is Counterparty => c !== null);
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

		// Write to Firestore, replacing form updatedAt with serverTimestamp() (server is source of truth)
		// Keep existing createdAt (don't overwrite it)
		const toWrite = {
			...updates,
			updatedAt: serverTimestamp()
		};

		await updateDoc(docRef, toWrite);
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
