import { subscribeToPayments } from '$lib/utils/v2/payments';
import type { Payment } from '$lib/types/v2/payment';
import type { Unsubscribe } from 'firebase/firestore';
import { logger } from '$lib/utils/logger';

export class PaymentState {
	payments = $state<Payment[]>([]);
	isLoading = $state(false);
	error = $state<string | null>(null);
	private unsubscribe: Unsubscribe | null = null;

	init() {
		if (this.unsubscribe) return;
		this.isLoading = true;

		try {
			this.unsubscribe = subscribeToPayments(
				(payments) => {
					this.payments = payments;
					this.isLoading = false;
					this.error = null;
				},
				(err) => {
					this.error = err.message;
					this.isLoading = false;
				}
			);
		} catch (e) {
			logger.error('Failed to init payment subscription', e);
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
	 * Get payment records for a specific contract
	 */
	getByContract(contractId: string): Payment[] {
		return this.payments.filter((p) => p.contractId === contractId);
	}
}

export const paymentState = new PaymentState();
