import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '$lib/config/firebase';
import type { BaseContract } from '$lib/types/v2';
import type { EquipmentRentalContract } from '$lib/types/v2/contracts';
import { createOneTimePayment, createRecurringPayments } from './payments';
import { logger } from '../logger';

interface MigrationResult {
	totalContracts: number;
	alreadyHadPayments: number;
	created: number;
	failed: { contractId: string; contractNumber: string; error: string }[];
}

/**
 * Fetch all contract IDs that already have payment records.
 * Returns a Set for O(1) lookup.
 */
async function getContractIdsWithPayments(): Promise<Set<string>> {
	const snapshot = await getDocs(collection(db, 'payments'));
	const ids = new Set<string>();
	for (const doc of snapshot.docs) {
		const contractId = doc.data().contractId as string;
		if (contractId) ids.add(contractId);
	}
	return ids;
}

/**
 * Fetch all documents from a Firestore collection as typed contracts.
 */
async function fetchAllContracts<T extends BaseContract>(
	collectionName: string
): Promise<T[]> {
	const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'));
	const snapshot = await getDocs(q);
	return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
}

/**
 * Generate monthly installments for an equipment rental contract.
 * Mirrors the logic in EquipmentRentalForm.svelte.
 */
function generateInstallments(
	contract: EquipmentRentalContract
): { label: string; dueDate: Date; amount: number }[] {
	const startDate = new Date(contract.rentalStartDate);
	const endDate = new Date(contract.rentalEndDate);
	const installments: { label: string; dueDate: Date; amount: number }[] = [];
	const current = new Date(startDate);

	while (current <= endDate) {
		const label = current.toLocaleDateString('en-US', {
			month: 'long',
			year: 'numeric'
		});
		installments.push({
			label,
			dueDate: new Date(current),
			amount: contract.monthlyRent
		});
		current.setMonth(current.getMonth() + 1);
	}

	return installments;
}

/**
 * Migrate existing contracts that have no payment records.
 *
 * - Service provision & event planning contracts get a one-time payment.
 * - Equipment rental contracts get recurring monthly payments.
 *
 * Safe to run multiple times — skips contracts that already have payments.
 */
export async function migrateExistingContractPayments(): Promise<MigrationResult> {
	const result: MigrationResult = {
		totalContracts: 0,
		alreadyHadPayments: 0,
		created: 0,
		failed: []
	};

	// Step 1: Get all contract IDs that already have payment records
	const existingPaymentContractIds = await getContractIdsWithPayments();

	// Step 2: Fetch all contracts from the 3 supported collections
	const [serviceContracts, eventContracts, equipmentContracts] = await Promise.all([
		fetchAllContracts<BaseContract>('service-provision-contracts'),
		fetchAllContracts<BaseContract>('event-planning-contracts'),
		fetchAllContracts<EquipmentRentalContract>('equipment-rental-contracts')
	]);

	const oneTimeContracts: BaseContract[] = [...serviceContracts, ...eventContracts];
	const allContracts = [...oneTimeContracts, ...equipmentContracts];
	result.totalContracts = allContracts.length;

	// Step 3: Create one-time payments for service & event contracts
	for (const contract of oneTimeContracts) {
		if (existingPaymentContractIds.has(contract.id)) {
			result.alreadyHadPayments++;
			continue;
		}

		try {
			await createOneTimePayment(contract);
			result.created++;
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			logger.error(`Migration failed for contract ${contract.id}:`, error);
			result.failed.push({
				contractId: contract.id,
				contractNumber: contract.contractNumber,
				error: message
			});
		}
	}

	// Step 4: Create recurring payments for equipment rental contracts
	for (const contract of equipmentContracts) {
		if (existingPaymentContractIds.has(contract.id)) {
			result.alreadyHadPayments++;
			continue;
		}

		try {
			const installments = generateInstallments(contract);
			if (installments.length > 0) {
				await createRecurringPayments(contract, installments);
			} else {
				await createOneTimePayment(contract);
			}
			result.created++;
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			logger.error(`Migration failed for equipment contract ${contract.id}:`, error);
			result.failed.push({
				contractId: contract.id,
				contractNumber: contract.contractNumber,
				error: message
			});
		}
	}

	logger.info('Payment migration complete:', result);
	return result;
}
