import {
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	signOut as firebaseSignOut,
	sendPasswordResetEmail,
	type User
} from 'firebase/auth';
import { auth } from '$lib/config/firebase';

/**
 * Sign up a new user with email and password
 */
export async function signUp(email: string, password: string): Promise<User> {
	const userCredential = await createUserWithEmailAndPassword(auth, email, password);
	return userCredential.user;
}

/**
 * Sign in an existing user with email and password
 */
export async function signIn(email: string, password: string): Promise<User> {
	const userCredential = await signInWithEmailAndPassword(auth, email, password);
	return userCredential.user;
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
	await firebaseSignOut(auth);
}

/**
 * Get the current user
 */
export function getCurrentUser(): User | null {
	return auth.currentUser;
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<void> {
	await sendPasswordResetEmail(auth, email);
}
