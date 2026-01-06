import { subscribeToPerformerBookingContracts } from '$lib/utils/v2/performerBookingContracts';
import type { PerformerBookingContract } from '$lib/types/v2';
import type { Unsubscribe } from 'firebase/firestore';

export class PerformerBookingContractState {
	contracts = $state<PerformerBookingContract[]>([]);
	isLoading = $state(false);
	error = $state<string | null>(null);
	private unsubscribe: Unsubscribe | null = null;

	init() {
		if (this.unsubscribe) return;
		this.isLoading = true;

		try {
			this.unsubscribe = subscribeToPerformerBookingContracts(
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
			console.error('Failed to init performer booking contract subscription', e);
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
	 * Get unpaid contracts
	 */
	get unpaid(): PerformerBookingContract[] {
		return this.contracts.filter((c) => c.paymentStatus === 'unpaid');
	}

	/**
	 * Get contracts by event
	 */
	getByEvent(eventId: string): PerformerBookingContract[] {
		return this.contracts.filter((c) => c.eventId === eventId);
	}

	/**
	 * Get contracts by counterparty
	 */
	getByCounterparty(counterpartyId: string): PerformerBookingContract[] {
		return this.contracts.filter((c) => c.counterpartyId === counterpartyId);
	}
}

export const performerBookingContractState = new PerformerBookingContractState();
