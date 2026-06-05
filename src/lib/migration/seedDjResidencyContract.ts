import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '$lib/config/firebase';

export interface SeedResult {
	dryRun: boolean;
	logs: string[];
	counterpartyId: string | null;
	contractId: string | null;
}

// Contract was signed on 10 Feb 2026
const CONTRACT_DATE = new Date('2026-02-10T00:00:00.000Z');

const COUNTERPARTY = {
	type: 'client' as const,
	clientType: 'company' as const,
	name: 'CÔNG TY TNHH BLUSH HỘI AN',
	companyName: 'CÔNG TY TNHH BLUSH HỘI AN',
	address: 'Hà Quảng Bắc, Phường Điện Bàn Đông, Thành phố Đà Nẵng, Việt Nam',
	taxId: '4001023215',
	representativeName: 'TỐNG THU ANH',
	representativePosition: 'Director/ Giám đốc',
	email: null,
	phone: null,
	notes: null
};

/**
 * Seeds the signed DJ Residency contract DJR-20260205-9759 (BLUSH HỘI AN venue)
 * and its counterparty into Firestore.
 *
 * Designed to be called from within the app (browser context) so Firebase auth
 * is already available — no separate authentication needed.
 *
 * @param dryRun - When true, logs what would be created without writing anything.
 */
export async function seedDjResidencyContract(dryRun: boolean = true): Promise<SeedResult> {
	const logs: string[] = [];
	const prefix = dryRun ? '[DRY RUN] ' : '';

	function log(msg: string) {
		logs.push(prefix + msg);
	}

	const ownerUid = auth.currentUser?.uid;
	if (!ownerUid) throw new Error('Not authenticated — please log in first');

	log(`Authenticated as ${auth.currentUser?.email} (${ownerUid})`);
	log('');

	// ── Step 1: Create venue counterparty ───────────────────────────────────
	const counterpartyDoc = {
		...COUNTERPARTY,
		ownerUid,
		createdAt: Timestamp.fromDate(CONTRACT_DATE),
		updatedAt: Timestamp.fromDate(CONTRACT_DATE)
	};

	log(`Step 1: Create venue counterparty`);
	log(`  name:     ${counterpartyDoc.name}`);
	log(`  address:  ${counterpartyDoc.address}`);
	log(`  taxId:    ${counterpartyDoc.taxId}`);
	log(`  rep:      ${counterpartyDoc.representativeName} (${counterpartyDoc.representativePosition})`);
	log(`  ownerUid: ${ownerUid}`);

	let counterpartyId: string | null = null;

	if (!dryRun) {
		const ref = await addDoc(collection(db, 'counterparties'), counterpartyDoc);
		counterpartyId = ref.id;
		log(`  ✓ Created: ${counterpartyId}`);
	} else {
		log('  → Would write to: counterparties');
	}

	log('');

	// ── Step 2: Create DJ residency contract ─────────────────────────────────
	// contractValue: app formula = fee × 8 performances/month × 4 months
	const PERFORMANCE_FEE = 4_000_000;
	const CONTRACT_VALUE = PERFORMANCE_FEE * 8 * 4; // 128,000,000 VND

	const contractDoc = {
		type: 'dj-residency',
		contractNumber: 'DJR-20260205-9759',
		paymentDirection: 'receivable',
		paymentStatus: 'unpaid',
		contractValue: CONTRACT_VALUE,
		paidAt: null,
		paidBy: null,
		notes: null,
		eventId: null,
		eventName: null,
		counterpartyId: counterpartyId ?? '(set on live run)',
		counterpartyName: COUNTERPARTY.name,
		ownerUid,
		// DJ residency fields
		contractStartDate: '2026-02-10',
		contractEndDate: '2026-06-09',
		contractDurationMonths: 4,
		performanceDays: 'Saturday and Sunday',
		performanceDaysVietnamese: 'Thứ Bảy và Chủ Nhật',
		performanceHoursPerSet: 4,
		numberOfSetsPerDay: 2,
		performanceFeeVND: PERFORMANCE_FEE,
		terminationNoticeDays: 7,
		residencyStatus: 'active',
		// Backdate to contract signed date
		createdAt: Timestamp.fromDate(CONTRACT_DATE),
		updatedAt: Timestamp.fromDate(CONTRACT_DATE)
	};

	log(`Step 2: Create DJ residency contract`);
	log(`  contractNumber: ${contractDoc.contractNumber}`);
	log(`  venue:          ${contractDoc.counterpartyName}`);
	log(`  period:         ${contractDoc.contractStartDate} → ${contractDoc.contractEndDate} (${contractDoc.contractDurationMonths} months)`);
	log(`  performance:    ${contractDoc.performanceDays}`);
	log(`  fee/set:        ${PERFORMANCE_FEE.toLocaleString('vi-VN')} VND`);
	log(`  hours/set:      ${contractDoc.performanceHoursPerSet}h × ${contractDoc.numberOfSetsPerDay} sets/day`);
	log(`  contractValue:  ${CONTRACT_VALUE.toLocaleString('vi-VN')} VND (estimated)`);
	log(`  status:         ${contractDoc.residencyStatus}`);
	log(`  counterpartyId: ${contractDoc.counterpartyId}`);

	let contractId: string | null = null;

	if (!dryRun) {
		const ref = await addDoc(collection(db, 'dj-residency-contracts'), contractDoc);
		contractId = ref.id;
		log(`  ✓ Created: ${contractId}`);
		log(`  ✓ View at: /contracts/dj-residency/${contractId}`);
	} else {
		log('  → Would write to: dj-residency-contracts');
	}

	return { dryRun, logs, counterpartyId, contractId };
}
