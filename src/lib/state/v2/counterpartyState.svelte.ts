import { subscribeToCounterparties } from '$lib/utils/v2/counterparties';
import type {
	Counterparty,
	ClientCounterparty,
	ContractorCounterparty,
	PerformerContractor,
	ServiceProviderContractor
} from '$lib/types/v2';
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
	 * Get clients
	 */
	get clients(): ClientCounterparty[] {
		return this.counterparties.filter(
			(c): c is ClientCounterparty => c.type === 'client'
		);
	}

	/**
	 * Get all contractors
	 */
	get contractors(): ContractorCounterparty[] {
		return this.counterparties.filter(
			(c): c is ContractorCounterparty => c.type === 'contractor'
		);
	}

	/**
	 * Get performers (contractor subtype)
	 */
	get performers(): PerformerContractor[] {
		return this.counterparties.filter(
			(c): c is PerformerContractor =>
				c.type === 'contractor' && 'contractorType' in c && c.contractorType === 'performer'
		);
	}

	/**
	 * Get service providers (contractor subtype)
	 */
	get serviceProviders(): ServiceProviderContractor[] {
		return this.counterparties.filter(
			(c): c is ServiceProviderContractor =>
				c.type === 'contractor' && 'contractorType' in c && c.contractorType === 'service-provider'
		);
	}

	/**
	 * Get counterparty by ID
	 */
	getById(counterpartyId: string): Counterparty | undefined {
		return this.counterparties.find((c) => c.id === counterpartyId);
	}
}

export const counterpartyState = new CounterpartyState();
