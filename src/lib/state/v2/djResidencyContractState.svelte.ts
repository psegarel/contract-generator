import { subscribeToDjResidencyContracts } from '$lib/utils/v2/djResidencyContracts';
import type { DjResidencyContract } from '$lib/types/v2';
import type { Unsubscribe } from 'firebase/firestore';
import { logger } from '$lib/utils/logger';

export class DjResidencyContractState {
	contracts = $state<DjResidencyContract[]>([]);
	isLoading = $state(false);
	error = $state<string | null>(null);
	private unsubscribe: Unsubscribe | null = null;

	init() {
		if (this.unsubscribe) return;
		this.isLoading = true;

		try {
			this.unsubscribe = subscribeToDjResidencyContracts(
				(contracts) => {
					this.contracts = contracts;
					this.isLoading = false;
					this.error = null;
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
