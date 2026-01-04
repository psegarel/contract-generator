/**
 * Firebase configuration for Node.js environment (migration scripts)
 *
 * This is separate from src/lib/config/firebase.ts because:
 * - firebase.ts uses import.meta.env (Vite-specific)
 * - Migration scripts run in Node.js via tsx (not Vite)
 * - We use process.env instead
 */

import { config } from 'dotenv';
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

// Load .env file
config();

// Firebase config from environment variables
const firebaseConfig = {
	apiKey: process.env.VITE_FIREBASE_API_KEY,
	authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
	projectId: process.env.VITE_FIREBASE_PROJECT_ID,
	storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
	appId: process.env.VITE_FIREBASE_APP_ID
};

// Validate required environment variables
const requiredEnvVars = [
	'VITE_FIREBASE_API_KEY',
	'VITE_FIREBASE_AUTH_DOMAIN',
	'VITE_FIREBASE_PROJECT_ID'
];

for (const envVar of requiredEnvVars) {
	if (!process.env[envVar]) {
		throw new Error(
			`Missing required environment variable: ${envVar}\n` +
			'Make sure your .env file exists and contains all Firebase configuration.'
		);
	}
}

// Initialize Firebase (singleton)
let app: FirebaseApp;
let db: Firestore;

if (getApps().length === 0) {
	app = initializeApp(firebaseConfig);
	db = getFirestore(app);
	console.log(`✓ Firebase initialized (Project: ${firebaseConfig.projectId})\n`);
} else {
	app = getApps()[0];
	db = getFirestore(app);
}

export { app, db };
