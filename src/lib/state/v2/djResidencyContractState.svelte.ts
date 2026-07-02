import {
	subscribeToDjResidencyContracts,
	syncContractValue
} from '$lib/utils/v2/djResidencyContracts';
import type { DjResidencyContract } from '$lib/types/v2';
import type { Unsubscribe } from 'firebase/firestore';
import { logger } from '$lib/utils/logger';

export class DjResidencyContractState {
	contracts = $state<DjResidencyContract[]>([]);
	isLoading = $state(false);
	error = $state<string | null>(null);
	private unsubscribe: Unsubscribe | null = null;
	// Tracks contract IDs currently being synced to avoid duplicate concurrent syncs.
	private syncingIds = new Set<string>();

	init() {
		if (this.unsubscribe) return;
		this.isLoading = true;

		try {
			this.unsubscribe = subscribeToDjResidencyContracts(
				(contracts) => {
					this.contracts = contracts;
					this.isLoading = false;
					this.error = null;
					this.syncUnsyncedContracts(contracts);
				},
				(err) => {
					this.error = err.message;
					this.isLoading = false;
				}
			);
		} catch (e) {
			logger.error('Failed to init DJ residency contract subscription', e);
			this.error = (e as Error).message;
			this.isLoading = false;
		}
	}

	/**
	 * Sync contractValue from performance subcollections for any contract where
	 * contractValue is still 0 (legacy data created before the field was tracked).
	 * Uses syncingIds to ensure each contract is only synced once per session.
	 */
	private syncUnsyncedContracts(contracts: DjResidencyContract[]) {
		for (const contract of contracts) {
			if (contract.contractValue === 0 && !this.syncingIds.has(contract.id)) {
				this.syncingIds.add(contract.id);
				syncContractValue(contract.id, contract.performanceFeeVND).catch((err) => {
					logger.error('Failed to sync contract value:', err, contract.id);
					this.syncingIds.delete(contract.id); // Allow retry next time
				});
			}
		}
	}

	destroy() {
		if (this.unsubscribe) {
			this.unsubscribe();
			this.unsubscribe = null;
		}
	}

	/**
	 * Get active contracts
	 */
	get active(): DjResidencyContract[] {
		return this.contracts.filter((c) => c.residencyStatus === 'active');
	}

	/**
	 * Get completed contracts
	 */
	get completed(): DjResidencyContract[] {
		return this.contracts.filter((c) => c.residencyStatus === 'completed');
	}

	/**
	 * Get terminated contracts
	 */
	get terminated(): DjResidencyContract[] {
		return this.contracts.filter((c) => c.residencyStatus === 'terminated');
	}

	/**
	 * Get contracts by counterparty (venue)
	 */
	getByCounterparty(counterpartyId: string): DjResidencyContract[] {
		return this.contracts.filter((c) => c.counterpartyId === counterpartyId);
	}
}

export const djResidencyContractState = new DjResidencyContractState();
