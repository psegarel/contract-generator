import { db } from '$lib/config/firebase';
import { doc, getDoc, setDoc, serverTimestamp, type Timestamp } from 'firebase/firestore';
import type { UserProfile } from '$lib/types/user';

/**
 * Repository for managing user profiles in Firestore
 */
export class UserRepository {
	private static readonly COLLECTION_NAME = 'users';

	/**
	 * Get a user profile by UID
	 */
	async getProfile(uid: string): Promise<UserProfile | null> {
		try {
			const ref = doc(db, UserRepository.COLLECTION_NAME, uid);
			const snap = await getDoc(ref);

			if (!snap.exists()) {
				return null;
			}

			return snap.data() as UserProfile;
		} catch (error) {
			console.error('Error fetching user profile:', error);
			throw new Error('Failed to fetch user profile');
		}
	}

	/**
	 * Create a new user profile
	 * Default isAdmin to false for new users
	 */
	async createProfile(uid: string, email: string): Promise<void> {
		try {
			const ref = doc(db, UserRepository.COLLECTION_NAME, uid);

			// Check if profile already exists
			const existing = await getDoc(ref);
			if (existing.exists()) {
				return; // Profile already exists, don't overwrite
			}

			const profile: Omit<UserProfile, 'createdAt' | 'updatedAt'> & {
				createdAt: ReturnType<typeof serverTimestamp>;
				updatedAt: ReturnType<typeof serverTimestamp>;
			} = {
				uid,
				email,
				isAdmin: false, // Default to non-admin
				createdAt: serverTimestamp(),
				updatedAt: serverTimestamp()
			};

			await setDoc(ref, profile);
		} catch (error) {
			console.error('Error creating user profile:', error);
			throw new Error('Failed to create user profile');
		}
	}

	/**
	 * Update admin status for a user
	 * This should only be called manually by system admin
	 */
	async setAdminStatus(uid: string, isAdmin: boolean): Promise<void> {
		try {
			const ref = doc(db, UserRepository.COLLECTION_NAME, uid);

			await setDoc(
				ref,
				{
					isAdmin,
					updatedAt: serverTimestamp()
				},
				{ merge: true }
			);
		} catch (error) {
			console.error('Error updating admin status:', error);
			throw new Error('Failed to update admin status');
		}
	}
}
