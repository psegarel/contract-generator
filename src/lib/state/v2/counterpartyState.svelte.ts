import { subscribeToCounterparties } from '$lib/utils/v2/counterparties';
import type { Counterparty } from '$lib/types/v2';
import type { Unsubscribe } from 'firebase/firestore';

export class CounterpartyState {
	counterparties = $state<Counterparty[]>([]);
	isLoading = $state(false);
	error = $state<string | null>(null);
	private unsubscribe: Unsubscribe | null = null;

	init() {
		if (this.unsubscribe) return;
		this.isLoading = true;

		try {
			this.unsubscribe = subscribeToCounterparties(
				(counterparties) => {
					this.counterparties = counterparties;
					this.isLoading = false;
					this.error = null;
				},
				(err) => {
					this.error = err.message;
					this.isLoading = false;
				}
			);
		} catch (e) {
			console.error('Failed to init counterparty subscription', e);
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
	 * Get counterparties by type
	 */
	getByType(type: Counterparty['type']): Counterparty[] {
		return this.counterparties.filter((c) => c.type === type);
	}

	/**
	 * Get venues
	 */
	get venues(): Counterparty[] {
		return this.getByType('venue');
	}

	/**
	 * Get performers
	 */
	get performers(): Counterparty[] {
		return this.getByType('performer');
	}

	/**
	 * Get service providers
	 */
	get serviceProviders(): Counterparty[] {
		return this.getByType('service-provider');
	}

	/**
	 * Get clients
	 */
	get clients(): Counterparty[] {
		return this.getByType('client');
	}

	/**
	 * Get suppliers
	 */
	get suppliers(): Counterparty[] {
		return this.getByType('supplier');
	}

	/**
	 * Get counterparty by ID
	 */
	getById(counterpartyId: string): Counterparty | undefined {
		return this.counterparties.find((c) => c.id === counterpartyId);
	}
}

export const counterpartyState = new CounterpartyState();
