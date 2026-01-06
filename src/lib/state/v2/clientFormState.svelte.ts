import type { ClientCounterparty } from '$lib/types/v2';

export class ClientFormState {
	name = $state('');
	email = $state('');
	phone = $state('');
	address = $state('');
	clientType = $state<'individual' | 'company'>('individual');
	companyName = $state('');
	representativeName = $state('');
	representativePosition = $state('');
	idDocument = $state('');
	taxId = $state('');
	bankName = $state('');
	bankAccountNumber = $state('');
	notes = $state('');

	// Form submission state
	isSubmitting = $state(false);
	error = $state<string | null>(null);

	/**
	 * Initialize form state from a client
	 */
	init(client: ClientCounterparty | null) {
		if (!client) {
			this.reset();
			return;
		}

		this.name = client.name;
		this.email = client.email || '';
		this.phone = client.phone || '';
		this.address = client.address || '';
		this.clientType = client.clientType;
		this.companyName = client.companyName || '';
		this.representativeName = client.representativeName || '';
		this.representativePosition = client.representativePosition || '';
		this.idDocument = client.idDocument || '';
		this.taxId = client.taxId || '';
		// Use nullish coalescing to ensure bank fields are strings (not null) for proper input display
		this.bankName = client.bankName ?? '';
		this.bankAccountNumber = client.bankAccountNumber ?? '';
		this.notes = client.notes || '';
	}

	/**
	 * Reset form to empty state
	 */
	reset() {
		this.name = '';
		this.email = '';
		this.phone = '';
		this.address = '';
		this.clientType = 'individual';
		this.companyName = '';
		this.representativeName = '';
		this.representativePosition = '';
		this.idDocument = '';
		this.taxId = '';
		this.bankName = '';
		this.bankAccountNumber = '';
		this.notes = '';
		this.error = null;
	}
}

