import type { Timestamp } from 'firebase/firestore';

/**
 * User profile data stored in Firestore users collection
 */
export interface UserProfile {
	uid: string; // Firebase User UID (document ID)
	email: string; // User's email address
	isAdmin: boolean; // Admin flag for elevated permissions
	createdAt: Timestamp; // When profile was created
	updatedAt: Timestamp; // Last profile update
}
