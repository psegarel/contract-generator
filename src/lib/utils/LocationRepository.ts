import { db } from '$lib/config/firebase';
import {
	collection,
	addDoc,
	setDoc,
	doc,
	getDoc,
	getDocs,
	deleteDoc,
	query,
	where,
	serverTimestamp,
	type Timestamp
} from 'firebase/firestore';
import { z } from 'zod';
import type { Location, SavedLocation } from '$lib/types/1';

const locationSchema = z.object({
	ownerUid: z.string().min(1),
	name: z.string().min(1),
	address: z.string().min(1),
	contactPerson: z.string().nullable().optional(),
	contactEmail: z.string().email().nullable().optional(),
	contactPhone: z.string().nullable().optional(),
	createdAt: z.unknown().optional(),
	updatedAt: z.unknown().optional()
});

/**
 * Repository for managing locations in Firestore
 */
export class LocationRepository {
	private static readonly COLLECTION_NAME = 'locations';

	/**
	 * List all locations (minimal data for selection)
	 */
	async list(): Promise<Array<{ id: string; name: string }>> {
		const snap = await getDocs(collection(db, LocationRepository.COLLECTION_NAME));
		return snap.docs.map((d) => ({ id: d.id, name: (d.data().name as string) || '' }));
	}

	/**
	 * Get a full location by ID
	 */
	async getById(id: string): Promise<SavedLocation | null> {
		const ref = doc(db, LocationRepository.COLLECTION_NAME, id);
		const snap = await getDoc(ref);

		if (!snap.exists()) return null;

		const data = snap.data();
		const parsed = locationSchema.safeParse({ ...data });

		if (!parsed.success) {
			console.warn('Invalid location data shape:', parsed.error?.message);
			return null;
		}

		return {
			id: snap.id,
			name: parsed.data.name,
			address: parsed.data.address,
			contactPerson: parsed.data.contactPerson ?? null,
			contactEmail: parsed.data.contactEmail ?? null,
			contactPhone: parsed.data.contactPhone ?? null,
			ownerUid: parsed.data.ownerUid,
			createdAt: data.createdAt as Timestamp,
			updatedAt: data.updatedAt as Timestamp
		};
	}

	/**
	 * Check for duplicate location name
	 */
	private async checkDuplicates(name: string, excludeId?: string): Promise<string | null> {
		const nameQuery = query(
			collection(db, LocationRepository.COLLECTION_NAME),
			where('name', '==', name.trim())
		);
		const nameSnap = await getDocs(nameQuery);
		const duplicateName = nameSnap.docs.find((doc) => doc.id !== excludeId);

		if (duplicateName) {
			return `A location with name "${name}" already exists.`;
		}

		return null;
	}

	/**
	 * Normalize location data
	 */
	private normalizeData(data: Location): Location {
		return {
			...data,
			name: data.name.trim()
		};
	}

	/**
	 * Create or update a location
	 */
	async upsert(ownerUid: string, data: Location, id?: string): Promise<string> {
		const normalizedData = this.normalizeData(data);

		// Check for duplicates
		const duplicateError = await this.checkDuplicates(normalizedData.name, id);

		if (duplicateError) {
			throw new Error(duplicateError);
		}

		const toWrite = {
			ownerUid,
			...normalizedData,
			updatedAt: serverTimestamp()
		};

		// Validate before write
		const parsed = locationSchema.safeParse(toWrite);
		if (!parsed.success) {
			throw new Error(`Invalid location payload: ${parsed.error?.message}`);
		}

		if (id) {
			// Update existing
			const ref = doc(db, LocationRepository.COLLECTION_NAME, id);
			await setDoc(ref, parsed.data, { merge: true });
			return id;
		}

		// Create new
		const ref = await addDoc(collection(db, LocationRepository.COLLECTION_NAME), {
			...parsed.data,
			createdAt: serverTimestamp()
		});
		return ref.id;
	}

	/**
	 * Delete a location
	 */
	async delete(id: string): Promise<boolean> {
		// Verify location exists
		const location = await this.getById(id);
		if (!location) {
			return false;
		}

		// Delete location document
		const ref = doc(db, LocationRepository.COLLECTION_NAME, id);
		await deleteDoc(ref);
		return true;
	}
}
