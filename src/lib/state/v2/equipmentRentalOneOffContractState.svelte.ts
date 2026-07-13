import { subscribeToEquipmentRentalOneOffContracts } from '$lib/utils/v2/equipmentRentalOneOffContracts';
import type { EquipmentRentalOneOffContract } from '$lib/types/v2';
import type { Unsubscribe } from 'firebase/firestore';
import { logger } from '$lib/utils/logger';

export class EquipmentRentalOneOffContractState {
	contracts = $state<EquipmentRentalOneOffContract[]>([]);
	isLoading = $state(false);
	error = $state<string | null>(null);
	private unsubscribe: Unsubscribe | null = null;

	init() {
		if (this.unsubscribe) return;
		this.isLoading = true;

		try {
			this.unsubscribe = subscribeToEquipmentRentalOneOffContracts(
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
			logger.error('Failed to init equipment rental one-off contract subscription', e);
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

	get unpaid(): EquipmentRentalOneOffContract[] {
		return this.contracts.filter((c) => c.paymentStatus === 'unpaid');
	}

	getByEvent(eventId: string): EquipmentRentalOneOffContract[] {
		return this.contracts.filter((c) => c.eventId === eventId);
	}

	getByCounterparty(counterpartyId: string): EquipmentRentalOneOffContract[] {
		return this.contracts.filter((c) => c.counterpartyId === counterpartyId);
	}
}

export const equipmentRentalOneOffContractState = new EquipmentRentalOneOffContractState();
