#!/usr/bin/env tsx
/// <reference types="node" />
/**
 * Seeds the signed DJ Residency contract (DJR-20260205-9759, BLUSH HỘI AN)
 * into Firestore as if it had been created through the application.
 *
 * - Preserves the original contract number DJR-20260205-9759
 * - Creates the venue counterparty (CÔNG TY TNHH BLUSH HỘI AN) first
 * - Uses the Firebase Auth + Firestore REST APIs (no extra packages required)
 *
 * Usage:
 *   FIREBASE_EMAIL=you@insense.vn FIREBASE_PASSWORD=secret npx tsx scripts/seed-dj-residency-contract.ts
 *   FIREBASE_EMAIL=... FIREBASE_PASSWORD=... npx tsx scripts/seed-dj-residency-contract.ts --live
 *
 * Without --live the script runs in dry-run mode and prints what would be created.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const isDryRun = !process.argv.includes('--live');

// ─── Load .env ────────────────────────────────────────────────────────────────
function loadEnv(): Record<string, string> {
	try {
		const contents = readFileSync(join(root, '.env'), 'utf-8');
		return Object.fromEntries(
			contents
				.split('\n')
				.map((l: string) => l.match(/^([^=]+)=(.*)$/))
				.filter((m): m is RegExpMatchArray => m !== null)
				.map((m: RegExpMatchArray) => [m[1].trim(), m[2].trim()])
		);
	} catch {
		return {};
	}
}

const env = loadEnv();
const PROJECT_ID = env.VITE_FIREBASE_PROJECT_ID ?? process.env.VITE_FIREBASE_PROJECT_ID ?? '';
const API_KEY = env.VITE_FIREBASE_API_KEY ?? process.env.VITE_FIREBASE_API_KEY ?? '';
const EMAIL = process.env.FIREBASE_EMAIL ?? '';
const PASSWORD = process.env.FIREBASE_PASSWORD ?? '';

if (!PROJECT_ID || !API_KEY) {
	console.error('❌  Missing VITE_FIREBASE_PROJECT_ID or VITE_FIREBASE_API_KEY in .env');
	process.exit(1);
}
if (!EMAIL || !PASSWORD) {
	console.error('❌  Set FIREBASE_EMAIL and FIREBASE_PASSWORD as environment variables');
	console.error('   FIREBASE_EMAIL=you@insense.vn FIREBASE_PASSWORD=secret npx tsx scripts/seed-dj-residency-contract.ts --live');
	process.exit(1);
}

// ─── Firestore REST helpers ───────────────────────────────────────────────────
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const AUTH_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;

type FirestoreValue =
	| { stringValue: string }
	| { integerValue: string }
	| { doubleValue: number }
	| { booleanValue: boolean }
	| { nullValue: null }
	| { timestampValue: string }
	| { mapValue: { fields: Record<string, FirestoreValue> } };

type FirestoreFields = Record<string, FirestoreValue>;

function str(v: string): { stringValue: string } { return { stringValue: v }; }
function int(v: number): { integerValue: string } { return { integerValue: String(v) }; }
function nul(): { nullValue: null } { return { nullValue: null }; }
function ts(iso: string): { timestampValue: string } { return { timestampValue: iso }; }

async function signIn(): Promise<string> {
	const res = await fetch(AUTH_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email: EMAIL, password: PASSWORD, returnSecureToken: true })
	});
	if (!res.ok) {
		const body = await res.text();
		throw new Error(`Auth failed: ${body}`);
	}
	const data = (await res.json()) as { idToken: string; localId: string };
	return data.idToken;
}

async function getUserId(): Promise<string> {
	const res = await fetch(AUTH_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email: EMAIL, password: PASSWORD, returnSecureToken: true })
	});
	const data = (await res.json()) as { idToken: string; localId: string };
	return data.localId;
}

async function createDocument(
	idToken: string,
	collection: string,
	fields: FirestoreFields
): Promise<string> {
	const res = await fetch(`${FIRESTORE_BASE}/${collection}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${idToken}`
		},
		body: JSON.stringify({ fields })
	});
	if (!res.ok) {
		const body = await res.text();
		throw new Error(`Failed to create ${collection} document: ${body}`);
	}
	const doc = (await res.json()) as { name: string };
	// name is like "projects/.../documents/collection/DOCID"
	return doc.name.split('/').pop()!;
}

// ─── Contract data ────────────────────────────────────────────────────────────
const SIGNED_DATE = '2026-02-10T00:00:00.000Z'; // contract signed / start date

const COUNTERPARTY_DATA = {
	type: 'client',
	clientType: 'company',
	name: 'CÔNG TY TNHH BLUSH HỘI AN',
	companyName: 'CÔNG TY TNHH BLUSH HỘI AN',
	address: 'Hà Quảng Bắc, Phường Điện Bàn Đông, Thành phố Đà Nẵng, Việt Nam',
	taxId: '4001023215',
	representativeName: 'TỐNG THU ANH',
	representativePosition: 'Director/ Giám đốc',
	email: null as null,
	phone: null as null
};

// contractValue: estimated using app formula — fee × 8 performances/month × 4 months
const ESTIMATED_CONTRACT_VALUE = 4_000_000 * 8 * 4; // 128,000,000 VND

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
	console.log('═'.repeat(60));
	console.log('  Seed: DJ Residency Contract DJR-20260205-9759');
	console.log('═'.repeat(60));
	console.log(`  Mode: ${isDryRun ? 'DRY RUN (use --live to write)' : '🚀 LIVE'}\n`);

	console.log('  Authenticating…');
	const [idToken, ownerUid] = await Promise.all([signIn(), getUserId()]);
	console.log(`  ✓ Signed in as ${EMAIL} (uid: ${ownerUid})\n`);

	// ── Step 1: Create counterparty ─────────────────────────────────────────
	console.log('  Step 1: Create venue counterparty');
	console.log('         ', COUNTERPARTY_DATA.name);

	const counterpartyFields: FirestoreFields = {
		type: str(COUNTERPARTY_DATA.type),
		clientType: str(COUNTERPARTY_DATA.clientType),
		name: str(COUNTERPARTY_DATA.name),
		companyName: str(COUNTERPARTY_DATA.companyName),
		address: str(COUNTERPARTY_DATA.address),
		taxId: str(COUNTERPARTY_DATA.taxId),
		representativeName: str(COUNTERPARTY_DATA.representativeName),
		representativePosition: str(COUNTERPARTY_DATA.representativePosition),
		email: nul(),
		phone: nul(),
		notes: nul(),
		ownerUid: str(ownerUid),
		createdAt: ts(SIGNED_DATE),
		updatedAt: ts(SIGNED_DATE)
	};

	let counterpartyId: string;
	if (isDryRun) {
		counterpartyId = '<auto-generated>';
		console.log('  [DRY RUN] Would create counterparty with fields:');
		console.log('  ', JSON.stringify(COUNTERPARTY_DATA, null, 2).split('\n').join('\n   '));
	} else {
		counterpartyId = await createDocument(idToken, 'counterparties', counterpartyFields);
		console.log(`  ✓ Created counterparty: ${counterpartyId}`);
	}

	// ── Step 2: Create contract ─────────────────────────────────────────────
	console.log('\n  Step 2: Create DJ residency contract');
	console.log('          Contract number: DJR-20260205-9759');

	const contractFields: FirestoreFields = {
		// Base contract fields
		type: str('dj-residency'),
		contractNumber: str('DJR-20260205-9759'),
		paymentDirection: str('receivable'),
		paymentStatus: str('unpaid'),
		contractValue: int(ESTIMATED_CONTRACT_VALUE),
		paidAt: nul(),
		paidBy: nul(),
		notes: nul(),
		eventId: nul(),
		eventName: nul(),
		counterpartyId: str(counterpartyId),
		counterpartyName: str(COUNTERPARTY_DATA.name),
		ownerUid: str(ownerUid),

		// DJ residency specific fields
		contractStartDate: str('2026-02-10'),
		contractEndDate: str('2026-06-09'),
		contractDurationMonths: int(4),
		performanceDays: str('Saturday and Sunday'),
		performanceDaysVietnamese: str('Thứ Bảy và Chủ Nhật'),
		performanceHoursPerSet: int(4),
		numberOfSetsPerDay: int(2),
		performanceFeeVND: int(4_000_000),
		terminationNoticeDays: int(7),
		residencyStatus: str('active'),

		// Timestamps: use contract signed date for createdAt
		createdAt: ts(SIGNED_DATE),
		updatedAt: ts(SIGNED_DATE)
	};

	if (isDryRun) {
		console.log('  [DRY RUN] Would create contract with fields:');
		const preview = {
			contractNumber: 'DJR-20260205-9759',
			type: 'dj-residency',
			counterpartyId,
			counterpartyName: COUNTERPARTY_DATA.name,
			ownerUid,
			contractStartDate: '2026-02-10',
			contractEndDate: '2026-06-09',
			contractDurationMonths: 4,
			performanceFeeVND: 4_000_000,
			contractValue: ESTIMATED_CONTRACT_VALUE,
			residencyStatus: 'active',
			paymentStatus: 'unpaid'
		};
		console.log('  ', JSON.stringify(preview, null, 2).split('\n').join('\n   '));
	} else {
		const contractId = await createDocument(idToken, 'dj-residency-contracts', contractFields);
		console.log(`  ✓ Created contract: ${contractId}`);
		console.log(`  ✓ Contract number:  DJR-20260205-9759`);
		console.log(`  ✓ View at: /contracts/dj-residency/${contractId}`);
	}

	console.log('\n' + '─'.repeat(60));
	if (isDryRun) {
		console.log('  Dry run complete. Run with --live to write to Firestore.');
	} else {
		console.log('  ✅  Seed complete.');
	}
}

main().catch((err) => {
	console.error('\n❌  Error:', err.message);
	process.exit(1);
});
