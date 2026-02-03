import type { EventPlanningContract, ClientCounterparty } from '$lib/types/v2';

/**
 * Form state class for Event Planning Contract forms
 * Manages all form fields and provides initialization/reset methods
 */
export class EventPlanningContractFormState {
	// Contract basics
	contractNumber = $state('');
	contractDate = $state('');
	contractLocation = $state('');
	eventId = $state<string>('');
	counterpartyId = $state<string>('');
	paymentStatus = $state<'unpaid' | 'paid'>('unpaid');

	// Client info
	clientCompany = $state('');
	clientAddress = $state('');
	clientTaxCode = $state('');
	clientRepresentativeName = $state('');
	clientRepresentativePosition = $state('');

	// Event info
	eventTheme = $state('');
	eventType = $state('');
	eventDescription = $state('');
	eventVenue = $state('');
	eventDate = $state('');
	eventDuration = $state('');
	expectedAttendance = $state('');

	// Financial
	contractValueVND = $state(0);
	vatRate = $state(10);
	depositPercentage = $state(50);
	finalPaymentPercentage = $state(50);
	professionalIndemnityAmount = $state(0);
	publicLiabilityAmount = $state(0);

	// Payment terms
	paymentDueDate = $state('');

	// Timeline
	planningMeetingDays = $state(7);
	performerBookingDeadline = $state('');
	technicalSetupDate = $state('');
	eventExecutionDate = $state('');
	setupCommencementTime = $state('');
	eventExecutionDuration = $state('');
	breakdownCompletionDateTime = $state('');

	// Legal
	paymentGracePeriodDays = $state(30);
	terminationNoticeDays = $state(7);
	negotiationPeriodDays = $state(14);
	arbitrationLocation = $state('Ho Chi Minh City');
	arbitrationLanguage = $state('Vietnamese');

	// Metadata
	notes = $state('');

	// UI state
	isSubmitting = $state(false);
	error = $state<string | null>(null);

	/**
	 * Initialize form state from an event planning contract
	 */
	init(contract: EventPlanningContract | null, initialEventId?: string) {
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

		// Load contract data (v2-only, no v1 compatibility)
		this.contractNumber = contract.contractNumber;
		this.contractDate = contract.contractDate;
		this.contractLocation = contract.contractLocation;
		this.eventId = contract.eventId || '';
		this.counterpartyId = contract.counterpartyId;
		this.paymentStatus = contract.paymentStatus;
		this.clientCompany = contract.clientCompany;
		this.clientAddress = contract.clientAddress;
		this.clientTaxCode = contract.clientTaxCode;
		this.clientRepresentativeName = contract.clientRepresentativeName;
		this.clientRepresentativePosition = contract.clientRepresentativePosition;
		this.eventTheme = contract.eventTheme || '';
		this.eventType = contract.eventType || '';
		this.eventDescription = contract.eventDescription || '';
		this.eventVenue = contract.eventVenue;
		this.eventDate = contract.eventDate;
		this.eventDuration = contract.eventDuration || '';
		this.expectedAttendance = contract.expectedAttendance || '';
		this.contractValueVND = contract.contractValueVND;
		this.vatRate = contract.vatRate;
		this.depositPercentage = contract.depositPercentage;
		this.finalPaymentPercentage = contract.finalPaymentPercentage;
		this.professionalIndemnityAmount = contract.professionalIndemnityAmount;
		this.publicLiabilityAmount = contract.publicLiabilityAmount;
		this.planningMeetingDays = contract.planningMeetingDays;
		this.performerBookingDeadline = contract.performerBookingDeadline;
		this.technicalSetupDate = contract.technicalSetupDate;
		this.eventExecutionDate = contract.eventExecutionDate;
		this.setupCommencementTime = contract.setupCommencementTime;
		this.eventExecutionDuration = contract.eventExecutionDuration;
		this.breakdownCompletionDateTime = contract.breakdownCompletionDateTime;
		this.paymentGracePeriodDays = contract.paymentGracePeriodDays;
		this.terminationNoticeDays = contract.terminationNoticeDays;
		this.negotiationPeriodDays = contract.negotiationPeriodDays;
		this.arbitrationLocation = contract.arbitrationLocation;
		this.arbitrationLanguage = contract.arbitrationLanguage;
		this.notes = contract.notes || '';
		// Payment due date - fallback to eventDate for existing contracts without it
		this.paymentDueDate = contract.paymentDueDate || contract.eventDate;
	}

	/**
	 * Reset form to empty state
	 */
	reset() {
		this.contractNumber = '';
		this.contractDate = '';
		this.contractLocation = '';
		this.eventId = '';
		this.counterpartyId = '';
		this.paymentStatus = 'unpaid';
		this.clientCompany = '';
		this.clientAddress = '';
		this.clientTaxCode = '';
		this.clientRepresentativeName = '';
		this.clientRepresentativePosition = '';
		this.eventTheme = '';
		this.eventType = '';
		this.eventDescription = '';
		this.eventVenue = '';
		this.eventDate = '';
		this.eventDuration = '';
		this.expectedAttendance = '';
		this.contractValueVND = 0;
		this.vatRate = 10;
		this.depositPercentage = 50;
		this.finalPaymentPercentage = 50;
		this.professionalIndemnityAmount = 0;
		this.publicLiabilityAmount = 0;
		this.planningMeetingDays = 7;
		this.performerBookingDeadline = '';
		this.technicalSetupDate = '';
		this.eventExecutionDate = '';
		this.setupCommencementTime = '';
		this.eventExecutionDuration = '';
		this.breakdownCompletionDateTime = '';
		this.paymentGracePeriodDays = 30;
		this.terminationNoticeDays = 7;
		this.negotiationPeriodDays = 14;
		this.arbitrationLocation = 'Ho Chi Minh City';
		this.arbitrationLanguage = 'Vietnamese';
		this.paymentDueDate = '';
		this.notes = '';
		this.error = null;
	}

	/**
	 * Generate a unique contract number for new contracts
	 */
	private generateContractNumber() {
		const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
		const timestamp = Date.now().toString().slice(-4);
		this.contractNumber = `EVT-${dateStr}-${timestamp}`;
	}

	/**
	 * Auto-fill client details from selected client counterparty
	 */
	fillFromClient(client: ClientCounterparty | null) {
		if (!client) return;

		// Handle null values from Firestore by converting to empty strings
		this.clientCompany = client.companyName || client.name || '';
		this.clientAddress = client.address || '';
		this.clientTaxCode = client.taxId || '';
		this.clientRepresentativeName = client.representativeName || '';
		this.clientRepresentativePosition = client.representativePosition || '';
	}
}
