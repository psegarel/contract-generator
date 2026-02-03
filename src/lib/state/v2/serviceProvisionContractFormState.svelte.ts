import type { ServiceProvisionContract, ServiceProviderCounterparty } from '$lib/types/v2';

/**
 * Form state class for Service Provision Contract forms
 * Manages all form fields and provides initialization/reset methods
 */
export class ServiceProvisionContractFormState {
	// Contract fields
	contractNumber = $state('');
	eventId = $state<string>('');
	counterpartyId = $state<string>('');
	jobName = $state('');
	jobContent = $state('');
	numberOfPerformances = $state(1);
	firstPerformanceTime = $state('');
	startDate = $state('');
	endDate = $state('');
	taxRate = $state(10);
	contractValue = $state(0);
	status = $state<'draft' | 'generated'>('draft');
	bankName = $state('');
	accountNumber = $state('');
	clientEmail = $state('');
	clientAddress = $state('');
	clientPhone = $state('');
	clientIdDocument = $state('');
	clientTaxId = $state('');
	eventLocation = $state('');
	paymentStatus = $state<'unpaid' | 'paid'>('unpaid');
	paymentDueDate = $state('');
	notes = $state('');

	// UI state
	isSubmitting = $state(false);
	error = $state<string | null>(null);
	showCreateProvider = $state(false);
	isCreatingProvider = $state(false);

	// New provider form fields
	newProviderName = $state('');
	newProviderServiceType = $state('');
	newProviderEmail = $state('');
	newProviderPhone = $state('');

	/**
	 * Initialize form state from a service provision contract
	 */
	init(contract: ServiceProvisionContract | null, initialEventId?: string) {
		if (!contract) {
			this.reset();
			// Set initial event ID if provided (for creating new contract from event page)
			if (initialEventId) {
				this.eventId = initialEventId;
			}
			// Auto-generate contract number for new contracts
			this.generateContractNumber();
			return;
		}

		// Load contract data
		this.contractNumber = contract.contractNumber;
		this.eventId = contract.eventId || '';
		this.counterpartyId = contract.counterpartyId;
		this.jobName = contract.jobName;
		this.jobContent = contract.jobContent;
		this.numberOfPerformances = contract.numberOfPerformances;
		this.firstPerformanceTime = contract.firstPerformanceTime;
		this.startDate = contract.startDate;
		this.endDate = contract.endDate;
		this.taxRate = contract.taxRate;
		// Use contractValue from BaseContract, fallback to netFee for backward compatibility
		this.contractValue = contract.contractValue ?? contract.netFee ?? 0;
		this.status = contract.status;
		// Ensure bank fields are strings (not null/undefined) for proper input display
		this.bankName = contract.bankName ?? '';
		this.accountNumber = contract.accountNumber ?? '';
		this.clientEmail = contract.clientEmail;
		this.clientAddress = contract.clientAddress;
		this.clientPhone = contract.clientPhone;
		this.clientIdDocument = contract.clientIdDocument;
		this.clientTaxId = contract.clientTaxId || '';
		this.eventLocation = contract.eventLocation;
		this.paymentStatus = contract.paymentStatus;
		// Payment due date - fallback to startDate for existing contracts without it
		this.paymentDueDate = contract.paymentDueDate || contract.startDate;
		this.notes = contract.notes || '';
	}

	/**
	 * Reset form to empty state
	 */
	reset() {
		this.contractNumber = '';
		this.eventId = '';
		this.counterpartyId = '';
		this.jobName = '';
		this.jobContent = '';
		this.numberOfPerformances = 1;
		this.firstPerformanceTime = '';
		this.startDate = '';
		this.endDate = '';
		this.taxRate = 10;
		this.contractValue = 0;
		this.status = 'draft';
		this.bankName = '';
		this.accountNumber = '';
		this.clientEmail = '';
		this.clientAddress = '';
		this.clientPhone = '';
		this.clientIdDocument = '';
		this.clientTaxId = '';
		this.eventLocation = '';
		this.paymentStatus = 'unpaid';
		this.paymentDueDate = '';
		this.notes = '';
		this.error = null;
		this.resetNewProviderForm();
	}

	/**
	 * Generate a unique contract number for new contracts
	 */
	private generateContractNumber() {
		const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
		const timestamp = Date.now().toString().slice(-4);
		this.contractNumber = `SVC-${dateStr}-${timestamp}`;
	}

	/**
	 * Auto-fill client details from selected service provider
	 */
	fillFromServiceProvider(provider: ServiceProviderCounterparty | null) {
		if (!provider) return;

		// Handle null values from Firestore by converting to empty strings
		this.clientEmail = provider.email ?? '';
		this.clientAddress = provider.address ?? '';
		this.clientPhone = provider.phone ?? '';
		// Service providers don't have these fields - user will need to fill manually
		this.clientIdDocument = '';
		this.clientTaxId = '';
		this.bankName = '';
		this.accountNumber = '';
	}

	/**
	 * Reset new provider form fields
	 */
	resetNewProviderForm() {
		this.newProviderName = '';
		this.newProviderServiceType = '';
		this.newProviderEmail = '';
		this.newProviderPhone = '';
		this.showCreateProvider = false;
		this.isCreatingProvider = false;
	}
}
