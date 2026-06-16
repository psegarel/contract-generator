import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '$lib/config/firebase';

const VIET_QR_URL = 'https://api.vietqr.io/v2/banks';

interface FirestoreBankConfig {
	banks: string[];
	lastRefreshed: Timestamp;
}

interface VietQRResponse {
	code: string;
	data: Array<{ shortName: string }>;
}

async function fetchBanksFromAPI(): Promise<string[]> {
	const response = await fetch(VIET_QR_URL);
	if (!response.ok) throw new Error(`VietQR API error: ${response.status}`);
	const json: VietQRResponse = await response.json();
	if (json.code !== '00') throw new Error('VietQR API returned non-success code');
	return json.data
		.map((b) => b.shortName)
		.filter(Boolean)
		.sort();
}

function bankConfigDocRef() {
	return doc(db, 'app-config', 'banks');
}

export async function getBankConfig(): Promise<{
	banks: string[];
	lastRefreshed: Timestamp | null;
}> {
	const snap = await getDoc(bankConfigDocRef());

	if (snap.exists()) {
		const data = snap.data() as FirestoreBankConfig;
		return { banks: data.banks, lastRefreshed: data.lastRefreshed ?? null };
	}

	// No cached list — fetch from API and persist
	const banks = await fetchBanksFromAPI();
	await setDoc(bankConfigDocRef(), { banks, lastRefreshed: serverTimestamp() });
	return { banks, lastRefreshed: Timestamp.now() };
}

export async function refreshBankList(): Promise<{
	banks: string[];
	lastRefreshed: Timestamp;
}> {
	const banks = await fetchBanksFromAPI();
	await setDoc(bankConfigDocRef(), { banks, lastRefreshed: serverTimestamp() });
	return { banks, lastRefreshed: Timestamp.now() };
}
