import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '$lib/config/firebase';

class AuthStore {
	user = $state<User | null>(null);
	loading = $state(true);
	initialized = $state(false);

	constructor() {
		// Initialize auth state listener
		if (typeof window !== 'undefined') {
			this.initAuthListener();
		}
	}

	private initAuthListener() {
		onAuthStateChanged(auth, (user) => {
			this.user = user;
			this.loading = false;
			this.initialized = true;
		});
	}

	get isAuthenticated(): boolean {
		return this.user !== null;
	}
}

export const authStore = new AuthStore();
