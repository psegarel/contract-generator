import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
	apiKey: 'AIzaSyAxkHyceVwyE5V7uzwAd-hN0UOeLlQDV1Q',
	authDomain: 'contract-generator-15dea.firebaseapp.com',
	projectId: 'contract-generator-15dea',
	storageBucket: 'contract-generator-15dea.firebasestorage.app',
	messagingSenderId: '945130533476',
	appId: '1:945130533476:web:aee029307028eaa1c7a571'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export default app;
