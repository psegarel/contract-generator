import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '$lib/config/firebase';
import type { UserProfile } from '$lib/types/user';
import { UserRepository } from '$lib/utils/UserRepository';

export class AuthStore {
	user = $state<User | null>(null);
	userProfile = $state<UserProfile | null>(null);
	loading = $state(true);
	initialized = $state(false);

	private userRepository = new UserRepository();

	constructor() {
		// Initialize auth state listener
		if (typeof window !== 'undefined') {
			this.initAuthListener();
		}
	}

	private initAuthListener() {
		onAuthStateChanged(auth, async (user) => {
			this.user = user;

			if (user) {
				// Fetch or create user profile
				await this.loadUserProfile(user.uid, user.email || '');
			} else {
				// Clear profile when user logs out
				this.userProfile = null;
			}

			this.loading = false;
			this.initialized = true;
		});
	}

	private async loadUserProfile(uid: string, email: string) {
		try {
			// Try to fetch existing profile
			let profile = await this.userRepository.getProfile(uid);

			// Create profile if it doesn't exist
			if (!profile) {
				await this.userRepository.createProfile(uid, email);
				profile = await this.userRepository.getProfile(uid);
			}

			this.userProfile = profile;
		} catch (error) {
			console.error('Error loading user profile:', error);
			// Set profile to null on error, but user is still authenticated
			this.userProfile = null;
		}
	}

	get isAuthenticated(): boolean {
		return this.user !== null;
	}

	get isAdmin(): boolean {
		return this.userProfile?.isAdmin ?? false;
	}
}

export const authStore = new AuthStore();
