import type { Timestamp } from 'firebase/firestore';

/**
 * Location data structure for creating/updating locations
 */
export interface Location {
	name: string;
	address: string;
	contactPerson: string | null;
	contactEmail: string | null;
	contactPhone: string | null;
}

/**
 * Saved location with Firebase metadata
 */
export interface SavedLocation extends Location {
	id: string;
	ownerUid: string;
	createdAt: Timestamp;
	updatedAt: Timestamp;
}
